import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';

const schema = z.object({
  query: z.string().optional().describe('Optional filter for grade name.'),
});

export const searchGradeOptionsTool: AIToolConfig<typeof schema> = {
  name: 'search_grade_options',
  description: 'Search for available grades/classes offered by the school.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    const grades = await prisma.grade.findMany({
      where: args.query ? { name: { contains: args.query, mode: 'insensitive' } } : undefined,
      orderBy: { sortOrder: 'asc' }
    });

    if (context?.userId) {
      await createAuditLog({
        actorUserId: context.userId,
        action: 'READ',
        entityType: 'Grade',
        entityId: 'AI_SEARCH',
        newValue: { query: args.query || 'ALL' },
      }).catch(() => {});
    }

    if (!grades.length) {
      return { status: 'no_results', message: `No grades found.` };
    }

    return {
      status: 'success',
      data: grades.map(g => ({
        id: g.id,
        name: g.name,
        isActive: g.isActive
      }))
    };
  }
};
