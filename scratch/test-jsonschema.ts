import { jsonSchema, tool } from 'ai';

try {
  const schema = jsonSchema({
    type: 'object',
    properties: {
      query: { type: 'string' }
    },
    additionalProperties: true
  });
  console.log("SUCCESS, jsonSchema helper exists!", schema);
} catch (e) {
  console.error("FAILED, jsonSchema helper does not exist:", e);
}
