import { getAvailableTools } from '../lib/ai/tool-executor';

const tools = getAvailableTools({ userId: 'mock', role: 'admin' });
for (const [name, t] of Object.entries(tools)) {
  // Let's call the internal serialization mechanism that Vercel AI SDK uses!
  // At runtime, Vercel AI SDK calls: (t.parameters as any).jsonSchema
  console.log(`TOOL ${name} parameters.jsonSchema:`, (t.parameters as any).jsonSchema);
}
