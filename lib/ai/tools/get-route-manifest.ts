import { z } from 'zod';
import { transportReport } from '@/features/reports/queries';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';
import { nullOrMessage } from '@/lib/ai/utils/response-helpers';

const schema = z.object({
  routeName: z.string().describe('The name of the route to filter by (e.g. Route A).'),
});

export const getRouteManifestTool: AIToolConfig<typeof schema> = {
  name: 'get_route_manifest',
  description: 'Returns a list of all students assigned to a specific transport route, with stops and vehicles.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    // Reuse existing report query (fetches where required = true)
    const allTransport = await transportReport({});
    
    // Filter by route name safely
    const routeManifest = allTransport.filter(t => 
      t.route?.name?.toLowerCase().includes(args.routeName.toLowerCase())
    );

    if (context?.userId) {
      await createAuditLog({
        actorUserId: context.userId,
        action: 'READ',
        entityType: 'TransportRequest',
        entityId: 'AI_SEARCH',
        newValue: { tool: 'get_route_manifest', route: args.routeName },
      }).catch(() => {});
    }

    if (!routeManifest.length) {
      return { status: 'no_results', message: `No students found for route '${args.routeName}'.` };
    }

    return {
      status: 'success',
      route: args.routeName,
      totalStudents: routeManifest.length,
      manifest: routeManifest.map(t => ({
        studentName: nullOrMessage(t.admission?.student?.fullNameEn, 'N/A'),
        admissionNo: nullOrMessage(t.admission?.admissionNo, 'N/A'),
        grade: nullOrMessage(t.admission?.grade?.name, 'N/A'),
        stopName: nullOrMessage(t.stop?.stopName, 'Not Assigned'),
        busNo: nullOrMessage(t.busNo, 'Not Assigned')
      }))
    };
  }
};
