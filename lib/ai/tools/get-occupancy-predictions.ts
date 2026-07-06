import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';

const schema = z.object({});

export const getOccupancyPredictionsTool: AIToolConfig<typeof schema> = {
  name: 'get_occupancy_predictions',
  description: 'Analyzes seat capacity, confirmed/pending admissions, and active registrations to calculate occupied percentages, remaining seats, and estimate risks of grades filling up.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    try {
      const capacities = await prisma.gradeSeatCapacity.findMany({
        include: { grade: true, campus: true }
      });

      const confirmedAdmissions = await prisma.admissionApplication.groupBy({
        by: ['gradeId', 'campusId'],
        where: { status: { in: ['CONFIRMED', 'TC_ISSUED'] } },
        _count: { id: true }
      });

      const pendingAdmissions = await prisma.admissionApplication.groupBy({
        by: ['gradeId', 'campusId'],
        where: { status: 'DRAFT' },
        _count: { id: true }
      });

      const openRegistrations = await prisma.registration.findMany({
        where: {
          status: 'REGISTERED',
          admissions: { none: {} }
        }
      });

      // Count registrations in JS
      const regCounts: Record<string, number> = {};
      for (const reg of openRegistrations) {
        const key = `${reg.gradeId}-${reg.campusId}`;
        regCounts[key] = (regCounts[key] || 0) + 1;
      }

      const predictions = capacities.map(cap => {
        const confirmed = confirmedAdmissions.find(
          c => c.gradeId === cap.gradeId && c.campusId === cap.campusId
        )?._count.id ?? 0;

        const pending = pendingAdmissions.find(
          p => p.gradeId === cap.gradeId && p.campusId === cap.campusId
        )?._count.id ?? 0;

        const key = `${cap.gradeId}-${cap.campusId}`;
        const activeRegs = regCounts[key] ?? 0;

        const totalSeats = cap.totalSeats;
        const remainingSeats = Math.max(0, totalSeats - confirmed);
        const occupancyRate = totalSeats > 0 ? (confirmed / totalSeats) * 100 : 0;
        
        // Potential occupancy if all pending and active registrations are confirmed
        const totalPipeline = pending + activeRegs;
        const projectedOccupancy = Math.min(totalSeats, confirmed + totalPipeline);
        const projectedOccupancyRate = totalSeats > 0 ? (projectedOccupancy / totalSeats) * 100 : 0;

        // Risk Assessment
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        let riskScore = 0; // scale 0-100

        if (remainingSeats === 0) {
          riskLevel = 'CRITICAL';
          riskScore = 100;
        } else {
          // Weight factors: remaining seats & pipeline demand vs availability
          const pipelineRatio = remainingSeats > 0 ? totalPipeline / remainingSeats : 0;
          if (occupancyRate >= 90 || pipelineRatio >= 1.2) {
            riskLevel = 'CRITICAL';
            riskScore = 90;
          } else if (occupancyRate >= 75 || pipelineRatio >= 0.8) {
            riskLevel = 'HIGH';
            riskScore = 75;
          } else if (occupancyRate >= 50 || pipelineRatio >= 0.4) {
            riskLevel = 'MEDIUM';
            riskScore = 50;
          }
        }

        return {
          grade: cap.grade.name,
          campus: cap.campus.name,
          totalSeats,
          confirmed,
          pending,
          activeRegistrations: activeRegs,
          remainingSeats,
          occupancyRate: Math.round(occupancyRate * 10) / 10,
          projectedOccupancyRate: Math.round(projectedOccupancyRate * 10) / 10,
          riskLevel,
          riskScore
        };
      });

      // Sort by risk score descending
      predictions.sort((a, b) => b.riskScore - a.riskScore);

      if (context?.userId) {
        await createAuditLog({
          actorUserId: context.userId,
          action: 'READ',
          entityType: 'GradeSeatCapacity',
          entityId: 'AI_ANALYTICS',
          newValue: { tool: 'get_occupancy_predictions' }
        }).catch(() => {});
      }

      return {
        status: 'success',
        predictions
      };

    } catch (error) {
      console.error('Error in getOccupancyPredictionsTool:', error);
      return { status: 'error', message: 'An error occurred while compiling occupancy projections.' };
    }
  }
};
