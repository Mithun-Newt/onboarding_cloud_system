import { executeTool } from '../lib/ai/tool-executor';
import { ExecutionContext } from '../lib/ai/types';

async function runTests() {
  const context: ExecutionContext = { userId: 'test-admin', role: 'SYSTEM_ADMIN' };

  const testCases = [
    { name: "Find Mithun's registration", query: "Mithun" },
    { name: "Search registration REG-2026-0001", query: "REG-2026-0001" },
    { name: "Show registration for Venkatesan", query: "Venkatesan" },
    { name: "Search parent mobile 9842773308", query: "9842773308" },
    { name: "Invalid input / no results", query: "xyz123invalid456" }
  ];

  for (const tc of testCases) {
    console.log(`\n================================`);
    console.log(`Testing: "${tc.name}"`);
    console.log(`Input Query: "${tc.query}"`);
    try {
      const result = await executeTool('search_registrations', { query: tc.query }, context);
      console.log(`Result:`, JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`Error:`, err);
    }
  }
}

runTests().then(() => console.log("\nTests complete."));
