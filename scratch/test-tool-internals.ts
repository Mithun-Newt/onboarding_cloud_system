import { searchRegistrationsTool } from '../lib/ai/tools/search-registrations';
import { tool, zodSchema } from 'ai';

const t = tool({
  description: searchRegistrationsTool.description,
  parameters: zodSchema(searchRegistrationsTool.schema),
  execute: async () => {}
});

console.log("TOOL KEYS:", Object.keys(t));
console.log("TOOL PARAMETERS:", t.parameters);
console.log("TOOL INPUT SCHEMA:", (t as any).inputSchema);
console.log("TOOL VALUE:", t);
