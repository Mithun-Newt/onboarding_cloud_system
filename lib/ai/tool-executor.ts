import { toolRegistry } from './tool-registry';
import { ExecutionContext } from './types';
import { tool, jsonSchema } from 'ai';

/**
 * Safely executes a registered tool, verifying it exists in the registry.
 */
export async function executeTool(toolName: string, args: any, context?: ExecutionContext) {
  const registeredTool = toolRegistry[toolName];
  
  if (!registeredTool) {
    throw new Error(`Tool not found in registry: ${toolName}`);
  }

  try {
    const result = await registeredTool.execute(args);
    return result;
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    throw error;
  }
}

/**
 * Converts a Zod Object Schema into a plain JSON Schema object,
 * bypassing SWC prototype checking bugs in Next.js bundler.
 */
function zodToJsonSchemaForSdk(zodObj: any) {
  const shape = zodObj.shape || {};
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    let currentVal = value as any;
    let isOptional = false;
    
    // Unpack optionals
    while (currentVal && currentVal._def) {
      if (currentVal._def.typeName === 'ZodOptional') {
        isOptional = true;
        currentVal = currentVal._def.innerType;
      } else if (currentVal._def.typeName === 'ZodEffects') {
        currentVal = currentVal._def.schema;
      } else {
        break;
      }
    }
    
    const description = currentVal?._def?.description;
    
    properties[key] = {
      type: 'string',
      ...(description ? { description } : {})
    };

    if (!isOptional && currentVal?._def?.typeName !== 'ZodDefault') {
      required.push(key);
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
    additionalProperties: false
  };
}

/**
 * Converts the custom Tool Registry into the format expected by the Vercel AI SDK `tools` map.
 */
export function getAvailableTools(context?: ExecutionContext) {
  const aiTools: Record<string, any> = {};

  for (const [key, config] of Object.entries(toolRegistry)) {
    const rawJsonSchema = zodToJsonSchemaForSdk(config.schema);
    const schemaWrapper = jsonSchema(rawJsonSchema);

    const t = tool({
      description: config.description,
      parameters: schemaWrapper,
      // @ts-expect-error - Dynamic schema typing makes TS complain about the execute signature
      execute: async (args: any) => {
        return executeTool(key, args, context);
      }
    });

    // Ensure compatibility with different AI SDK versions by providing both parameters and inputSchema
    (t as any).inputSchema = (t as any).parameters;
    aiTools[key] = t;
  }

  return aiTools;
}
