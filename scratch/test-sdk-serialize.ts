import { searchRegistrationsTool } from '../lib/ai/tools/search-registrations';
import { asSchema } from '@ai-sdk/provider-utils';

try {
  const schema = asSchema(searchRegistrationsTool.schema);
  console.log("asSchema SUCCESS:", JSON.stringify(schema, null, 2));
} catch (e) {
  console.error("asSchema FAILED:", e);
}
