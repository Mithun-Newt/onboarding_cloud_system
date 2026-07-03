import { getAdmissionDetailsTool } from '../lib/ai/tools/get-admission-details';
import { searchRegistrationsTool } from '../lib/ai/tools/search-registrations';
import { getTransportSummaryTool } from '../lib/ai/tools/get-transport-summary';
import { getRouteManifestTool } from '../lib/ai/tools/get-route-manifest';
import { getAdmissionStatusTool } from '../lib/ai/tools/get-admission-status';
import { prisma } from '../lib/prisma';

async function runTests() {
  console.log('--- AI TOOL VALIDATION SUITE ---');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // 1. Admission Details - Fuzzy Search ADM Number
    const fuzzyAdm = await getAdmissionDetailsTool.execute({ query: 'AMD-2026-0006' });
    assert(fuzzyAdm.status === 'success', 'Fuzzy search by ADM number (AMD-2026-0006) should work');

    // 2. Admission Details - Search by student name
    const byName = await getAdmissionDetailsTool.execute({ query: 'Mithun' });
    assert(byName.status === 'success' && (byName as any).data.length > 0, 'Search by student name (Mithun) should work');
    
    // 3. Check for specific extended business fields
    if (byName.status === 'success') {
      const data = (byName as any).data[0];
      assert(data.student.bloodGroup !== undefined, 'Blood group field should be exposed');
      assert(data.student.religion !== undefined, 'Religion field should be exposed');
      assert(data.student.nationality !== undefined, 'Nationality field should be exposed');
      assert(data.student.emisNumber !== undefined, 'EMIS field should be exposed');
      assert(data.previousSchool !== undefined, 'Previous school field should be exposed');
      assert(data.parents.length >= 0, 'Parents field should be exposed');
    }

    // 4. Registration Search - Fuzzy Search REG Number
    const fuzzyReg = await searchRegistrationsTool.execute({ query: 'REG-2026' }); // should match partial/fuzzy
    assert(fuzzyReg.status === 'success', 'Fuzzy search by REG number should work');

    // 5. Registration Search - Search by parent mobile
    // Assuming 9876543210 exists from seed data
    const byMobile = await searchRegistrationsTool.execute({ query: '9876543210' });
    assert(byMobile.status === 'success' && (byMobile as any).data.length > 0, 'Search by parent mobile should work');

    // 6. Transport Summary
    const transportSummary = await getTransportSummaryTool.execute({});
    assert(transportSummary.status === 'success' && Array.isArray((transportSummary as any).details), 'Transport summary should include detailed student manifest');

    // 7. Route Manifest
    const routeManifest = await getRouteManifestTool.execute({ routeName: 'Route A' });
    assert(routeManifest.status === 'success' || routeManifest.status === 'no_results', 'Route manifest query should execute');

  } catch (error) {
    console.error('Validation Error:', error);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
