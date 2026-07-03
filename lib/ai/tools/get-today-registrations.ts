import { z } from 'zod';
import { registrationSummaryReport } from '@/features/reports/queries';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';
import { format } from 'date-fns';

const schema = z.object({});

export const getTodayRegistrationsTool: AIToolConfig<typeof schema> = {
  name: 'get_today_registrations',
  description: 'Returns a list of all student registrations created today.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const registrations = await registrationSummaryReport({ startDate: todayStr, endDate: todayStr });

    if (context?.userId) {
      await createAuditLog({
        actorUserId: context.userId,
        action: 'READ',
        entityType: 'Registration',
        entityId: 'AI_SEARCH',
        newValue: { tool: 'get_today_registrations', count: registrations.length },
      }).catch(() => {});
    }

    return {
      status: 'success',
      totalToday: registrations.length,
      data: registrations.map(r => ({
        registrationNo: r.registrationNo,
        studentName: r.studentName,
        grade: r.grade?.name,
        campus: r.campus?.name,
        status: r.status,
        enquirySource: r.enquirySource?.name || 'Walk-in'
      }))
    };
  }
};
