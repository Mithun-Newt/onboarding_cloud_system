import { z } from 'zod';
import { getDashboardStats } from '@/features/dashboard/queries';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';

const schema = z.object({});

export const getDailyActionItemsTool: AIToolConfig<typeof schema> = {
  name: 'get_daily_action_items',
  description: 'Returns a summary of pending operational tasks for the day (e.g. pending documents, fee collections pending).',
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
        newValue: { tool: 'get_daily_action_items' },
      }).catch(() => {});
    }

    return {
      status: 'success',
      actionItems: [
        { task: "Follow up on Pending Documents", count: stats.pendingDocuments },
        { task: "Follow up on Pending Fees", count: stats.feePending },
        { task: "Process New Registrations", count: stats.todayRegistrations },
        { task: "Process Special Support Reviews", count: stats.specialSupport }
      ]
    };
  }
};
