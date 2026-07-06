import { getDailyAiBriefingTool } from '../lib/ai/tools/get-daily-ai-briefing';

async function testBriefing() {
  console.log('--- TESTING DAILY AI BRIEFING TOOL ---');

  try {
    const res = await getDailyAiBriefingTool.execute({});
    
    if (res.status === 'success') {
      console.log('✅ Daily Briefing Tool Executed Successfully!');
      console.log('\n--- Briefing Summary ---');
      console.log(JSON.stringify(res.summary, null, 2));

      console.log('\n--- Prioritized Admission Queue (Ranked) ---');
      console.log(JSON.stringify(res.prioritizedQueue, null, 2));

      console.log('\n--- Identified Bottlenecks ---');
      console.log(JSON.stringify(res.bottlenecks, null, 2));

      console.log('\n--- Recommended Next Actions ---');
      console.log(JSON.stringify(res.recommendedActions, null, 2));
    } else {
      console.error('❌ Briefing Tool Execution Failed:', res);
    }
  } catch (err) {
    console.error('Test Execution Error:', err);
  }
}

testBriefing();
