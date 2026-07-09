import { coordinatorAgent } from '../lib/ai/agents/coordinator-agent';
import { parseSharedMemory } from '../lib/ai/shared-memory/session-state';

async function runTest() {
  console.log('--- SPRINT 3A INFRASTRUCTURE VALIDATION ---');

  const sampleMessages = [
    { role: 'user', content: 'Show Mithun\'s admission record.' },
    { role: 'tool', content: JSON.stringify({ studentName: 'Mithun', admissionNo: 'ADM-2026-0006', studentId: 'std-11' }) },
    { role: 'user', content: 'What route is he assigned to and has he paid his fees?' }
  ];

  const context = parseSharedMemory(sampleMessages);
  console.log('\nParsed Shared Context State:');
  console.log(context);

  const lastQuery = sampleMessages[sampleMessages.length - 1].content;
  console.log(`\nExecuting Coordinator query: "${lastQuery}"`);
  
  const result = await coordinatorAgent.executeQuery(lastQuery, context);
  console.log('\nCoordinator Synthesized Result:');
  console.log(result.response);

  console.log('\nSprint 3A validation completed successfully!');
}

runTest();
