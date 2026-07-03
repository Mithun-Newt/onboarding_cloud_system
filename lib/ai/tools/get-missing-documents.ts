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

export const getMissingDocumentsTool: AIToolConfig<typeof schema> = {
  name: 'get_missing_documents',
  description: 'Return pending documents, rejected documents, and overall verification status for a student.',
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
        student: {
          include: {
            documents: {
              include: { documentType: true }
            }
          }
        },
      },
      take: 3
    });

    if (context?.userId) {
      await createAuditLog({
        actorUserId: context.userId,
        action: 'READ',
        entityType: 'StudentDocument',
        entityId: 'AI_SEARCH',
        newValue: { query: args.query, tool: 'get_missing_documents' },
      }).catch(() => {});
    }

    if (!records.length) {
      return { status: 'no_results', message: `No student records found for '${args.query}'.` };
    }

    return {
      status: 'success',
      data: records.map(r => {
        const docs = r.student.documents;
        const pending = docs.filter(d => d.status === 'NOT_RECEIVED');
        const rejected = docs.filter(d => d.status === 'REJECTED');
        const uploaded = docs.filter(d => d.status === 'UPLOADED');
        const verified = docs.filter(d => d.status === 'VERIFIED');

        let overallStatus = 'PENDING_UPLOAD';
        if (rejected.length > 0) overallStatus = 'ACTION_REQUIRED_REJECTED';
        else if (pending.length === 0 && uploaded.length > 0) overallStatus = 'PENDING_VERIFICATION';
        else if (pending.length === 0 && uploaded.length === 0) overallStatus = 'FULLY_VERIFIED';

        return {
          admissionNo: r.admissionNo || 'DRAFT',
          studentName: r.student.fullNameEn,
          overallVerificationStatus: overallStatus,
          pendingDocuments: pending.map(d => d.documentType.name),
          rejectedDocuments: rejected.map(d => ({ name: d.documentType.name, reason: d.remarks })),
          awaitingStaffVerification: uploaded.map(d => d.documentType.name),
        };
      })
    };
  }
};
