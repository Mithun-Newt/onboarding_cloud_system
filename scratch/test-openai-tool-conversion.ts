import { getAvailableTools } from '../lib/ai/tool-executor';
// Let's import the internal prepareTools function from groq provider!
// @ts-ignore
import { prepareTools } from '@ai-sdk/groq/internal';

const tools = getAvailableTools({ userId: 'mock', role: 'admin' });

// Convert tools to the format expected by the model
const languageModelTools = Object.entries(tools).map(([name, t]: any) => ({
  type: 'function',
  name,
  description: t.description,
  inputSchema: t.parameters, // Wait, is inputSchema t.parameters? Yes, under some versions, or is it compiled?
}));

console.log("prepareTools:", prepareTools);
if (prepareTools) {
  try {
    const prepared = prepareTools({
      tools: Object.entries(tools).map(([name, t]: any) => ({
        type: 'function',
        name,
        description: t.description,
        inputSchema: t.parameters.jsonSchema, // Pass raw JSON schema
      })),
      modelId: 'llama-3.1-8b-instant',
    });
    console.log("PREPARED TOOLS:", JSON.stringify(prepared.tools, null, 2));
  } catch (e) {
    console.error("prepareTools failed:", e);
  }
}
