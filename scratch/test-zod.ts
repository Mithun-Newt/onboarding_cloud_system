import { searchRegistrationsTool } from '../lib/ai/tools/search-registrations';
import { zodSchema } from 'ai';

console.log("SCHEMA:", searchRegistrationsTool.schema);
console.log("WRAPPED SCHEMA:", JSON.stringify(zodSchema(searchRegistrationsTool.schema).jsonSchema, null, 2));
