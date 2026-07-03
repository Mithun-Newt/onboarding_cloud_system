import { searchRegistrationsTool } from '../lib/ai/tools/search-registrations';
import { tool, zodSchema } from 'ai';
import { asSchema } from '@ai-sdk/provider-utils';

const t1 = tool({
  description: 'test1',
  parameters: zodSchema(searchRegistrationsTool.schema),
});

const t2 = tool({
  description: 'test2',
  parameters: searchRegistrationsTool.schema,
});

console.log("t1 parameters.jsonSchema:", (t1.parameters as any).jsonSchema);
console.log("t2 parameters.jsonSchema:", (t2.parameters as any).jsonSchema);

const schema1 = asSchema(t1.parameters);
const schema2 = asSchema(t2.parameters);
console.log("schema1 properties:", Object.keys(schema1.jsonSchema.properties || {}));
console.log("schema2 properties:", Object.keys(schema2.jsonSchema.properties || {}));
