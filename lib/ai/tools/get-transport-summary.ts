import { z } from 'zod';
import { transportReport } from '@/features/reports/queries';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';
import { nullOrMessage } from '@/lib/ai/utils/response-helpers';

const schema = z.object({});

export const getTransportSummaryTool: AIToolConfig<typeof schema> = {
  name: 'get_transport_summary',
  description: 'Returns an overall summary of transport usage grouped by routes, along with vehicle and bus assignments.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    // Reuse existing report query (fetches where required = true)
    const allTransport = await transportReport({});

    if (context?.userId) {
      await createAuditLog({
        actorUserId: context.userId,
        action: 'READ',
        entityType: 'TransportRequest',
        entityId: 'AI_SEARCH',
        newValue: { tool: 'get_transport_summary' },
      }).catch(() => {});
    }

    const summaryByRoute = allTransport.reduce((acc, t) => {
      const routeName = t.route?.name || 'Unassigned Route';
      acc[routeName] = (acc[routeName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const details = allTransport.map(t => ({
      studentName: nullOrMessage(t.admission?.student?.fullNameEn, 'N/A'),
      admissionNo: nullOrMessage(t.admission?.admissionNo, 'N/A'),
      grade: nullOrMessage(t.admission?.grade?.name, 'N/A'),
      route: nullOrMessage(t.route?.name, 'N/A'),
      routeNo: nullOrMessage(t.route?.routeNo, 'N/A'),
      stop: nullOrMessage(t.stop?.stopName, 'N/A'),
      busNo: nullOrMessage(t.busNo, 'N/A'),
      remarks: nullOrMessage(t.remarks, 'N/A'),
    }));

    return {
      status: 'success',
      totalStudentsUsingTransport: allTransport.length,
      routeBreakdown: summaryByRoute,
      details,
    };
  }
};
