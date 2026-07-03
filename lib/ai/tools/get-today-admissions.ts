import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';
import { startOfDay, endOfDay } from 'date-fns';

const schema = z.object({});

export const getTodayAdmissionsTool: AIToolConfig<typeof schema> = {
  name: 'get_today_admissions',
  description: 'Returns a list of all admissions confirmed today.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    const admissions = await prisma.admissionApplication.findMany({
      where: {
        status: { in: ['CONFIRMED', 'TC_ISSUED'] },
        confirmedAt: { gte: start, lte: end }
      },
      include: {
        student: { select: { fullNameEn: true } },
        grade: true,
        campus: true
      },
      orderBy: { confirmedAt: 'desc' }
    });

    if (context?.userId) {
      await createAuditLog({
        actorUserId: context.userId,
        action: 'READ',
        entityType: 'AdmissionApplication',
        entityId: 'AI_SEARCH',
        newValue: { tool: 'get_today_admissions', count: admissions.length },
      }).catch(() => {});
    }

    return {
      status: 'success',
      totalToday: admissions.length,
      data: admissions.map(a => ({
        admissionNo: a.admissionNo,
        studentName: a.student.fullNameEn,
        grade: a.grade?.name,
        campus: a.campus?.name,
        confirmedAt: a.confirmedAt
      }))
    };
  }
};
