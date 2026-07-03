import { z } from 'zod';
import { feeCollectedReport } from '@/features/reports/queries';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';
import { format } from 'date-fns';

const schema = z.object({
  startDate: z.string().optional().describe('Start date (YYYY-MM-DD). If omitted, defaults to today.'),
  endDate: z.string().optional().describe('End date (YYYY-MM-DD). If omitted, defaults to today.'),
});

export const generateCollectionReportTool: AIToolConfig<typeof schema> = {
  name: 'generate_collection_report',
  description: 'Generates a report of fees collected within a given date range.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const start = args.startDate || todayStr;
    const end = args.endDate || todayStr;

    const collections = await feeCollectedReport({ startDate: start, endDate: end });

    if (context?.userId) {
      await createAuditLog({
        actorUserId: context.userId,
        action: 'READ',
        entityType: 'Payment',
        entityId: 'AI_SEARCH',
        newValue: { tool: 'generate_collection_report', start, end },
      }).catch(() => {});
    }

    const totalCollected = collections.reduce((sum, c) => sum + Number(c.amount), 0);
    const byFeeType = collections.reduce((acc, c) => {
      acc[c.feeType] = (acc[c.feeType] || 0) + Number(c.amount);
      return acc;
    }, {} as Record<string, number>);

    return {
      status: 'success',
      period: { start, end },
      totalTransactions: collections.length,
      totalCollected,
      breakdownByFeeType: byFeeType,
      recentTransactions: collections.slice(0, 5).map(c => ({
        admissionNo: c.admission?.admissionNo,
        studentName: c.admission?.student?.fullNameEn,
        amount: Number(c.amount),
        feeType: c.feeType,
        collectedBy: c.collectedBy?.fullName
      }))
    };
  }
};
