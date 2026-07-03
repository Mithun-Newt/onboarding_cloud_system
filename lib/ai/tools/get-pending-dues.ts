import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';

const schema = z.object({
  query: z.string().optional().describe('General search query (name, admission number, or registration number)'),
  studentName: z.string().optional().describe('Filter by student name'),
  name: z.string().optional().describe('Alias for student name'),
  admissionNo: z.string().optional().describe('Filter by exact admission number'),
  admissionNumber: z.string().optional().describe('Alias for admission number'),
  registrationNo: z.string().optional().describe('Filter by exact registration number'),
  registrationNumber: z.string().optional().describe('Alias for registration number'),
});

export const getPendingDuesTool: AIToolConfig<typeof schema> = {
  name: 'get_pending_dues',
  description: 'Return pending fees, due amount, and payment status for a specific student.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    const searchQuery = args.query || args.studentName || args.name || args.admissionNo || args.admissionNumber || args.registrationNo || args.registrationNumber;

    if (!searchQuery) {
      return { status: 'error', message: 'Missing student name or admission number. Please clarify who you are checking.' };
    }
    
    const records = await prisma.admissionApplication.findMany({
      where: {
        OR: [
          { admissionNo: { equals: searchQuery, mode: 'insensitive' } },
          { student: { fullNameEn: { contains: searchQuery, mode: 'insensitive' } } }
        ]
      },
      include: {
        student: { select: { fullNameEn: true } },
        payments: {
          where: { paymentStatus: { in: ['PENDING', 'PARTIAL'] } }
        }
      },
      take: 3
    });

    if (context?.userId) {
      await createAuditLog({
        actorUserId: context.userId,
        action: 'READ',
        entityType: 'Payment',
        entityId: 'AI_SEARCH',
        newValue: { query: args.query, tool: 'get_pending_dues' },
      }).catch(() => {});
    }

    if (!records.length) {
      return { status: 'no_results', message: `No student records found for '${args.query}'.` };
    }

    return {
      status: 'success',
      data: records.map(r => {
        const totalDue = r.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        
        return {
          admissionNo: r.admissionNo || 'DRAFT',
          studentName: r.student.fullNameEn,
          totalPendingAmount: totalDue,
          pendingFeeItems: r.payments.map(p => ({
            feeType: p.feeType,
            amount: Number(p.amount),
            status: p.paymentStatus
          })),
        };
      })
    };
  }
};
