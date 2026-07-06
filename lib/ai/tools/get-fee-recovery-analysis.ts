import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';

const schema = z.object({});

export const getFeeRecoveryAnalysisTool: AIToolConfig<typeof schema> = {
  name: 'get_fee_recovery_analysis',
  description: 'Performs a comprehensive outstanding fee analysis, including grade/campus breakdowns, ranking parents by outstanding balances, and identifying the top 20% of parents who owe 80% of outstanding dues (Pareto analysis).',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    try {
      const pendingPayments = await prisma.payment.findMany({
        where: { paymentStatus: { in: ['PENDING', 'PARTIAL'] } },
        include: {
          admission: {
            include: {
              grade: true,
              campus: true,
              student: {
                include: {
                  family: {
                    include: {
                      guardians: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      let totalOutstanding = 0;
      const duesByGrade: Record<string, number> = {};
      const duesByCampus: Record<string, number> = {};
      const duesByFamily: Record<string, { familyId: string; guardians: string[]; studentNames: string[]; amount: number }> = {};

      for (const payment of pendingPayments) {
        const amount = Number(payment.amount);
        totalOutstanding += amount;

        // Group by Grade
        const gradeName = payment.admission?.grade?.name || 'Unassigned Grade';
        duesByGrade[gradeName] = (duesByGrade[gradeName] || 0) + amount;

        // Group by Campus
        const campusName = payment.admission?.campus?.name || 'Unassigned Campus';
        duesByCampus[campusName] = (duesByCampus[campusName] || 0) + amount;

        // Group by Family/Parent
        const student = payment.admission?.student;
        const familyId = student?.familyId || 'no-family-id';
        const studentName = student?.fullNameEn || 'Unknown Student';

        if (!duesByFamily[familyId]) {
          const guardians = student?.family?.guardians.map(g => `${g.fullName} (${g.relationship})`) || ['No Guardian Listed'];
          duesByFamily[familyId] = {
            familyId,
            guardians,
            studentNames: [studentName],
            amount: 0
          };
        } else {
          if (!duesByFamily[familyId].studentNames.includes(studentName)) {
            duesByFamily[familyId].studentNames.push(studentName);
          }
        }
        duesByFamily[familyId].amount += amount;
      }

      // Sort families by outstanding amount desc
      const sortedFamilies = Object.values(duesByFamily).sort((a, b) => b.amount - a.amount);

      // Pareto Analysis: Top 20% of parents contributing to ~80% of outstanding fees
      const paretoThreshold = totalOutstanding * 0.8;
      let cumulativeSum = 0;
      const paretoFamilies: typeof sortedFamilies = [];
      const nonParetoFamilies: typeof sortedFamilies = [];

      for (const fam of sortedFamilies) {
        if (cumulativeSum < paretoThreshold) {
          paretoFamilies.push(fam);
          cumulativeSum += fam.amount;
        } else {
          nonParetoFamilies.push(fam);
        }
      }

      const topParentsCount = Math.max(1, Math.round(sortedFamilies.length * 0.2));
      const top20PercentFamilies = sortedFamilies.slice(0, topParentsCount);
      const top20Sum = top20PercentFamilies.reduce((sum, f) => sum + f.amount, 0);
      const top20PercentageOfTotal = totalOutstanding > 0 ? (top20Sum / totalOutstanding) * 100 : 0;

      if (context?.userId) {
        await createAuditLog({
          actorUserId: context.userId,
          action: 'READ',
          entityType: 'Payment',
          entityId: 'AI_ANALYTICS',
          newValue: { tool: 'get_fee_recovery_analysis', totalOutstanding }
        }).catch(() => {});
      }

      return {
        status: 'success',
        totalOutstanding,
        duesByGrade: Object.entries(duesByGrade).map(([grade, amount]) => ({ grade, amount })).sort((a, b) => b.amount - a.amount),
        duesByCampus: Object.entries(duesByCampus).map(([campus, amount]) => ({ campus, amount })).sort((a, b) => b.amount - a.amount),
        parentRecoveryRanking: sortedFamilies.map(f => ({
          guardians: f.guardians,
          students: f.studentNames,
          outstandingAmount: f.amount
        })),
        paretoAnalysis: {
          description: `The top ${top20PercentFamilies.length} families (approx ${topParentsCount > 0 ? Math.round((topParentsCount / sortedFamilies.length) * 100) : 0}% of debtors) account for ₹${top20Sum} (${Math.round(top20PercentageOfTotal)}%) of the total outstanding dues. Focus recovery efforts here first.`,
          targetFamilies: top20PercentFamilies.map(f => ({
            guardians: f.guardians,
            students: f.studentNames,
            amount: f.amount
          }))
        }
      };

    } catch (error) {
      console.error('Error in getFeeRecoveryAnalysisTool:', error);
      return { status: 'error', message: 'An error occurred while compiling fee recovery data.' };
    }
  }
};
