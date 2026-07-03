import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getRemainingVacancyForGrade } from '@/features/admissions/actions';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';

const schema = z.object({
  gradeName: z.string().optional().describe('Optional name of the grade to check (e.g. "Grade 1"). If omitted, checks all grades.'),
});

export const checkSeatCapacityTool: AIToolConfig<typeof schema> = {
  name: 'check_seat_capacity',
  description: 'Return grade capacity, occupied seats, and available seats.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    // We assume current academic year if none provided in context
    const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!currentYear) throw new Error("No active academic year found");

    const grades = await prisma.grade.findMany({
      where: args.gradeName ? { name: { equals: args.gradeName, mode: 'insensitive' } } : { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    if (!grades.length) {
      return { status: 'no_results', message: `No grades found matching '${args.gradeName}'` };
    }

    const data = [];
    for (const grade of grades) {
      const vacancy = await getRemainingVacancyForGrade(grade.id, currentYear.id);
      
      const dbConfirmed = await prisma.admissionApplication.count({
        where: {
          gradeId: grade.id,
          academicYearId: currentYear.id,
          status: { in: ["CONFIRMED", "TC_ISSUED"] },
        },
      });

      data.push({
        grade: grade.name,
        occupiedSeats: dbConfirmed,
        availableSeats: vacancy
      });
    }

    if (context?.userId) {
      await createAuditLog({
        actorUserId: context.userId,
        action: 'READ',
        entityType: 'GradeSeatCapacity',
        entityId: 'AI_SEARCH',
        newValue: { query: args.gradeName },
      }).catch(() => {});
    }

    return {
      status: 'success',
      academicYear: currentYear.label,
      data
    };
  }
};
