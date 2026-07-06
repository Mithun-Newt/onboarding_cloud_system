import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';

const schema = z.object({});

export const getRegistrationConversionAnalysisTool: AIToolConfig<typeof schema> = {
  name: 'get_registration_conversion_analysis',
  description: 'Calculates registration-to-admission conversion percentages, identifies drop-off points, calculates largest loss stages, and recommends actions to improve pipeline throughput.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    try {
      const registrations = await prisma.registration.findMany({
        include: {
          admissions: {
            include: {
              payments: true
            }
          },
          grade: true,
          campus: true
        }
      });

      let regCount = registrations.length;
      let appCount = 0;
      let confirmedCount = 0;
      let feePaidCount = 0;

      // Grouped by grade and campus for granular analysis
      const conversionByGrade: Record<string, { reg: number; app: number; confirmed: number; paid: number }> = {};
      const conversionByCampus: Record<string, { reg: number; app: number; confirmed: number; paid: number }> = {};

      for (const reg of registrations) {
        const gradeName = reg.grade?.name || 'Unassigned';
        const campusName = reg.campus?.name || 'Unassigned';

        if (!conversionByGrade[gradeName]) {
          conversionByGrade[gradeName] = { reg: 0, app: 0, confirmed: 0, paid: 0 };
        }
        if (!conversionByCampus[campusName]) {
          conversionByCampus[campusName] = { reg: 0, app: 0, confirmed: 0, paid: 0 };
        }

        conversionByGrade[gradeName].reg++;
        conversionByCampus[campusName].reg++;

        const hasApplication = reg.admissions.length > 0;
        if (hasApplication) {
          appCount++;
          conversionByGrade[gradeName].app++;
          conversionByCampus[campusName].app++;

          const confirmed = reg.admissions.some(a => a.status === 'CONFIRMED' || a.status === 'TC_ISSUED');
          if (confirmed) {
            confirmedCount++;
            conversionByGrade[gradeName].confirmed++;
            conversionByCampus[campusName].confirmed++;

            // Check if fees are paid
            const hasPendingFees = reg.admissions.some(a => 
              a.payments.some(p => p.paymentStatus === 'PENDING' || p.paymentStatus === 'PARTIAL')
            );
            if (!hasPendingFees) {
              feePaidCount++;
              conversionByGrade[gradeName].paid++;
              conversionByCampus[campusName].paid++;
            }
          }
        }
      }

      // Drop-off point percentages
      const regToAppRate = regCount > 0 ? (appCount / regCount) * 100 : 0;
      const appToConfirmRate = appCount > 0 ? (confirmedCount / appCount) * 100 : 0;
      const confirmToPaidRate = confirmedCount > 0 ? (feePaidCount / confirmedCount) * 100 : 0;
      const overallConversionRate = regCount > 0 ? (feePaidCount / regCount) * 100 : 0;

      // Identify largest drop-off stage
      let largestLossStage = 'Registration to Application Linkage';
      let largestLossPercentage = 100 - regToAppRate;

      if (100 - appToConfirmRate > largestLossPercentage) {
        largestLossStage = 'Application Draft to Confirmed Admission';
        largestLossPercentage = 100 - appToConfirmRate;
      }
      if (100 - confirmToPaidRate > largestLossPercentage) {
        largestLossStage = 'Confirmed Admission to Completed Fee Payment';
        largestLossPercentage = 100 - confirmToPaidRate;
      }

      // Recommendations based on drop-off point
      const recommendations: string[] = [];
      if (regToAppRate < 80) {
        recommendations.push('High drop-off between Registration and Application. Enable auto-creation of application drafts for all completed registrations.');
      }
      if (appToConfirmRate < 85) {
        recommendations.push('High drop-off in confirming applications. Focus on missing required document verification bottlenecks to push drafts to confirmation.');
      }
      if (confirmToPaidRate < 90) {
        recommendations.push('High drop-off in fee payments after confirmation. Implement SMS/email automatic payment alerts for outstanding collections.');
      }

      if (context?.userId) {
        await createAuditLog({
          actorUserId: context.userId,
          action: 'READ',
          entityType: 'Registration',
          entityId: 'AI_ANALYTICS',
          newValue: { tool: 'get_registration_conversion_analysis', overallConversionRate }
        }).catch(() => {});
      }

      return {
        status: 'success',
        funnel: {
          registrations: regCount,
          applicationsCreated: appCount,
          admissionsConfirmed: confirmedCount,
          fullyPaidConfirmedAdmissions: feePaidCount
        },
        rates: {
          registrationToApplicationPercent: Math.round(regToAppRate * 10) / 10,
          applicationToConfirmationPercent: Math.round(appToConfirmRate * 10) / 10,
          confirmationToFullyPaidPercent: Math.round(confirmToPaidRate * 10) / 10,
          overallConversionPercent: Math.round(overallConversionRate * 10) / 10
        },
        analysis: {
          largestLossStage,
          dropOffLossPercent: Math.round(largestLossPercentage * 10) / 10,
          recommendations
        },
        byGrade: Object.entries(conversionByGrade).map(([grade, counts]) => ({
          grade,
          regCount: counts.reg,
          conversionRate: counts.reg > 0 ? Math.round((counts.paid / counts.reg) * 100) : 0
        })),
        byCampus: Object.entries(conversionByCampus).map(([campus, counts]) => ({
          campus,
          regCount: counts.reg,
          conversionRate: counts.reg > 0 ? Math.round((counts.paid / counts.reg) * 100) : 0
        }))
      };

    } catch (error) {
      console.error('Error in getRegistrationConversionAnalysisTool:', error);
      return { status: 'error', message: 'An error occurred while compiling conversion statistics.' };
    }
  }
};
