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
  aadhaar: z.string().optional().describe('Filter by Aadhaar number'),
  emis: z.string().optional().describe('Filter by EMIS number'),
  parentMobile: z.string().optional().describe('Filter by parent mobile number'),
});

export const getAdmissionStatusTool: AIToolConfig<typeof schema> = {
  name: 'get_admission_status',
  description: 'Return current admission status, status history, and pending requirements.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    const rawQuery = args.query || args.studentName || args.name || args.admissionNo || args.admissionNumber || args.registrationNo || args.registrationNumber || args.aadhaar || args.emis || args.parentMobile;

    if (!rawQuery) {
      return { status: 'error', message: 'Missing search term. Please provide a name, admission number, registration number, Aadhaar, EMIS, or mobile.' };
    }
    
    const searchQuery = rawQuery.trim();
    const cleanQuery = searchQuery.replace(/^AMD-/i, 'ADM-').replace(/^REG-/i, 'REG-');
    
    const records = await prisma.admissionApplication.findMany({
      where: {
        OR: [
          { admissionNo: { equals: cleanQuery, mode: 'insensitive' } },
          { registration: { registrationNo: { equals: cleanQuery, mode: 'insensitive' } } },
          { student: { fullNameEn: { contains: cleanQuery, mode: 'insensitive' } } },
          { student: { aadhaarNo: { equals: cleanQuery } } },
          { student: { emisNumber: { equals: cleanQuery } } },
          { student: { family: { guardians: { some: { mobile: { contains: cleanQuery } } } } } },
          { student: { family: { guardians: { some: { fullName: { contains: cleanQuery, mode: 'insensitive' } } } } } }
        ]
      },
      include: {
        student: {
          include: {
            documents: {
              where: { status: { in: ['NOT_RECEIVED', 'REJECTED'] }, documentType: { isRequired: true } },
              include: { documentType: true }
            }
          }
        },
        statusHistory: { orderBy: { changedAt: 'desc' } },
        payments: { where: { paymentStatus: 'PENDING' } }
      },
      take: 3
    });

    if (context?.userId) {
      await createAuditLog({
        actorUserId: context.userId,
        action: 'READ',
        entityType: 'AdmissionApplication',
        entityId: 'AI_SEARCH',
        newValue: { query: args.query, tool: 'get_admission_status' },
      }).catch(() => {});
    }

    if (!records.length) {
      return { status: 'no_results', message: `No records found for '${args.query}'.` };
    }

    return {
      status: 'success',
      data: records.map(r => ({
        admissionNo: r.admissionNo || 'DRAFT',
        studentName: r.student.fullNameEn,
        currentStatus: r.status,
        statusHistory: r.statusHistory.map(h => ({
          toStatus: h.toStatus,
          date: h.changedAt
        })),
        pendingRequirements: {
          missingDocuments: r.student.documents.map(d => d.documentType.name),
          pendingFees: r.payments.map(p => p.feeType)
        }
      }))
    };
  }
};
