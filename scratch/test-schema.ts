import { z } from 'zod';
import { zodSchema } from 'ai';

const searchSchema = z.object({
  query: z.string().describe('The name, registration number, or parent mobile number to search for.'),
});

console.log(JSON.stringify(zodSchema(searchSchema).jsonSchema, null, 2));
