import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';

const schema = z.object({});

export const getRegistrationConversionSummaryTool: AIToolConfig<typeof schema> = {
  name: 'get_registration_conversion_summary',
  description: 'Returns the overall conversion rate from registrations to confirmed admissions.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    const whereYear = currentYear ? { academicYearId: currentYear.id } : {};

    const totalRegistrations = await prisma.registration.count({ where: whereYear });
    const totalAdmitted = await prisma.registration.count({
      where: { ...whereYear, status: 'ADMITTED' }
    });
    
    // Also consider those marked as ADMISSION_STARTED if they are confirmed in AdmissionApplication table
    const totalConfirmedAdmissions = await prisma.admissionApplication.count({
      where: { ...whereYear, status: { in: ['CONFIRMED', 'TC_ISSUED'] } }
    });

    if (context?.userId) {
      await createAuditLog({
        actorUserId: context.userId,
        action: 'READ',
        entityType: 'Registration',
        entityId: 'AI_SEARCH',
        newValue: { tool: 'get_registration_conversion_summary' },
      }).catch(() => {});
    }

    const rate = totalRegistrations > 0 ? ((totalConfirmedAdmissions / totalRegistrations) * 100).toFixed(2) : 0;

    return {
      status: 'success',
      academicYear: currentYear?.label || 'All Time',
      summary: {
        totalRegistrations,
        totalConfirmedAdmissions,
        conversionRatePercentage: rate
      }
    };
  }
};
