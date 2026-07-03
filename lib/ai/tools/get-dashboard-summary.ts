import { z } from 'zod';
import { getDashboardStats } from '@/features/dashboard/queries';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';

const schema = z.object({});

export const getDashboardSummaryTool: AIToolConfig<typeof schema> = {
  name: 'get_dashboard_summary',
  description: 'Returns a high-level operational overview including total seats, admissions, registrations, and transport metrics.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    const stats = await getDashboardStats();

    if (context?.userId) {
      await createAuditLog({
        actorUserId: context.userId,
        action: 'READ',
        entityType: 'Dashboard',
        entityId: 'AI_SEARCH',
        newValue: { tool: 'get_dashboard_summary' },
      }).catch(() => {});
    }

    return {
      status: 'success',
      summary: {
        todayRegistrations: stats.todayRegistrations,
        todayAdmissionsConfirmed: stats.todayConfirmed,
        pendingVerificationDocuments: stats.pendingDocuments,
        pendingFeePayments: stats.feePending,
        transportRequiredCount: stats.transportRequired,
        specialSupportRequests: stats.specialSupport
      },
      seatInfo: stats.seatInfo.map(s => ({
        grade: s.grade,
        totalTarget: s.total,
        admitted: s.admitted,
        vacancy: s.remainingVacancy
      }))
    };
  }
};
