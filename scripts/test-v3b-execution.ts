import { coordinatorAgent } from '../lib/ai/agents/coordinator-agent';
import { parseSharedMemory } from '../lib/ai/shared-memory/session-state';

async function runTest() {
  console.log('--- SPRINT 3B SPECIALIST REAL INTEGRATION TEST ---');

  const sampleMessages = [
    { role: 'user', content: 'Show Mithun\'s admission record.' },
    { role: 'tool', content: JSON.stringify({ studentName: 'Mithun', admissionNo: 'ADM-2026-0006', studentId: 'std-11' }) },
    { role: 'user', content: 'How are seat occupancy predictions going and what is the outstanding fee balance for grade 1?' }
  ];

  const context = parseSharedMemory(sampleMessages);
  console.log('\nParsed Context Memory:');
  console.log(context);

  const query = sampleMessages[sampleMessages.length - 1].content;
  console.log(`\nExecuting Query: "${query}"`);

  const result = await coordinatorAgent.executeQuery(query, context);
  console.log('\n=== Synthesized Coordinator Response ===');
  console.log(result.response);
  console.log('========================================');
  
  console.log('\nSprint 3B test execution finished successfully.');
}

runTest();
