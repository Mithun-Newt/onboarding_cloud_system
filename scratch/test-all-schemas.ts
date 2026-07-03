import { getAvailableTools } from '../lib/ai/tool-executor';

const tools = getAvailableTools({ userId: 'mock', role: 'admin' });
for (const [name, t] of Object.entries(tools)) {
  console.log(`TOOL ${name} PARAMETERS TYPE:`, typeof t.parameters);
  console.log(`TOOL ${name} PARAMETERS JSON SCHEMA:`, JSON.stringify((t.parameters as any).jsonSchema, null, 2));
}
