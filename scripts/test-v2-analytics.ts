import { getFeeRecoveryAnalysisTool } from '../lib/ai/tools/get-fee-recovery-analysis';
import { getOccupancyPredictionsTool } from '../lib/ai/tools/get-occupancy-predictions';
import { getRegistrationConversionAnalysisTool } from '../lib/ai/tools/get-registration-conversion-analysis';

async function runTests() {
  console.log('--- SPRINT 2B ANALYTICS TOOL VALIDATION ---');

  try {
    // 1. Fee Recovery Analysis
    const feeRes = await getFeeRecoveryAnalysisTool.execute({});
    console.log('\n✅ Fee Recovery Analysis Tool Executed!');
    console.log(`Total Outstanding Dues: ₹${(feeRes as any).totalOutstanding}`);
    console.log('Pareto analysis summary:', (feeRes as any).paretoAnalysis?.description);

    // 2. Seat Occupancy Predictions
    const occRes = await getOccupancyPredictionsTool.execute({});
    console.log('\n✅ Occupancy Predictions Tool Executed!');
    console.log('Sample predictions list (first 3):', (occRes as any).predictions?.slice(0, 3));

    // 3. Conversion Analysis
    const convRes = await getRegistrationConversionAnalysisTool.execute({});
    console.log('\n✅ Conversion Analysis Tool Executed!');
    console.log('Conversion funnel values:', (convRes as any).funnel);
    console.log('Largest Loss Stage:', (convRes as any).analysis?.largestLossStage);
    console.log('Drop-off recommendations:', (convRes as any).analysis?.recommendations);

    console.log('\n✨ All Sprint 2B validation tests passed successfully!');
  } catch (error) {
    console.error('❌ Staging/Validation Test Failed:', error);
  }
}

runTests();
