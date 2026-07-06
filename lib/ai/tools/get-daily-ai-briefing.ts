import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';
import { startOfDay, endOfDay, differenceInDays } from 'date-fns';

const schema = z.object({});

export const getDailyAiBriefingTool: AIToolConfig<typeof schema> = {
  name: 'get_daily_ai_briefing',
  description: 'Returns a comprehensive operational briefing summarizing today\'s registrations, admissions, seat availability, transport status, pending fee recovery, document bottlenecks, and recommended prioritized next actions for staff.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    try {
      const today = new Date();
      const start = startOfDay(today);
      const end = endOfDay(today);

      // 1. Registrations Today
      const regsToday = await prisma.registration.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { grade: true, campus: true }
      });

      // 2. Admissions Confirmed Today
      const admsToday = await prisma.admissionApplication.findMany({
        where: {
          status: { in: ['CONFIRMED', 'TC_ISSUED'] },
          confirmedAt: { gte: start, lte: end }
        },
        include: {
          student: { select: { fullNameEn: true } },
          grade: true,
          campus: true
        }
      });

      // 3. Document types configuration (to know which are required)
      const reqDocTypes = await prisma.documentType.findMany({
        where: { isRequired: true }
      });

      // 4. Pending Documents
      // Documents that are required and status is NOT_RECEIVED or REJECTED
      const pendingDocs = await prisma.studentDocument.findMany({
        where: {
          status: { in: ['NOT_RECEIVED', 'REJECTED'] },
          documentType: { isRequired: true }
        },
        include: {
          student: true,
          documentType: true
        }
      });

      // 5. Pending Fee Collections
      const pendingPayments = await prisma.payment.findMany({
        where: { paymentStatus: { in: ['PENDING', 'PARTIAL'] } },
        include: {
          admission: {
            include: {
              student: true,
              grade: true
            }
          }
        }
      });

      // 6. Seat Capacity & Vacancy Predictions
      const capacities = await prisma.gradeSeatCapacity.findMany({
        include: { grade: true, campus: true, academicYear: true }
      });
      const confirmedCounts = await prisma.admissionApplication.groupBy({
        by: ['gradeId', 'campusId', 'academicYearId'],
        where: { status: { in: ['CONFIRMED', 'TC_ISSUED'] } },
        _count: { id: true }
      });

      const seatSummary = capacities.map(cap => {
        const admitted = confirmedCounts.find(
          c => c.gradeId === cap.gradeId && c.campusId === cap.campusId && c.academicYearId === cap.academicYearId
        )?._count.id ?? 0;
        const available = Math.max(0, cap.totalSeats - admitted);
        return {
          grade: cap.grade.name,
          campus: cap.campus.name,
          total: cap.totalSeats,
          admitted,
          available,
          isAlmostFull: available > 0 && available <= 5
        };
      });

      // 7. Transport Pending Allocation
      const pendingTransport = await prisma.transportRequest.findMany({
        where: {
          required: true,
          OR: [
            { routeId: null },
            { stopId: null },
            { busNo: null }
          ]
        },
        include: {
          admission: {
            include: {
              student: true,
              grade: true
            }
          }
        }
      });

      // 8. Pending/Draft Admissions to prioritize
      const draftAdmissions = await prisma.admissionApplication.findMany({
        where: { status: 'DRAFT' },
        include: {
          student: {
            include: {
              documents: true
            }
          },
          payments: true,
          grade: true,
          campus: true
        }
      });

      // Let's analyze and prioritize draft admissions
      const prioritizedQueue = draftAdmissions.map(adm => {
        // Calculate missing required documents
        const verifiedDocTypeIds = adm.student.documents
          .filter(doc => doc.status === 'VERIFIED' || doc.status === 'WAIVED')
          .map(doc => doc.documentTypeId);
        
        const missingReqDocNames = reqDocTypes
          .filter(dt => !verifiedDocTypeIds.includes(dt.id))
          .map(dt => dt.name);

        const hasPendingDocs = missingReqDocNames.length > 0;

        // Calculate pending payments
        const outstandingFees = adm.payments
          .filter(p => p.paymentStatus === 'PENDING' || p.paymentStatus === 'PARTIAL');
        const pendingFeeSum = outstandingFees.reduce((sum, p) => sum + Number(p.amount), 0);
        const hasPendingFees = pendingFeeSum > 0;

        // Check seat availability
        const seatInfo = seatSummary.find(
          s => s.grade === adm.grade?.name && s.campus === adm.campus?.name
        );
        const seatAvailable = (seatInfo?.available ?? 0) > 0;

        // Assign Prioritized Rank
        let rank = 4; // Default rank (Pending Both)
        let reasonDetails: string[] = [];

        if (!seatAvailable) {
          rank = 5; // No Vacancy
          reasonDetails.push(`No seat available in ${adm.grade?.name} at ${adm.campus?.name}`);
        } else if (!hasPendingDocs && !hasPendingFees) {
          rank = 1; // Ready for Approval
          reasonDetails.push('All required documents verified');
          reasonDetails.push('All pending fees paid');
          reasonDetails.push('Seat available in target grade');
          reasonDetails.push('Awaiting administrator confirmation/approval');
        } else if (!hasPendingDocs && hasPendingFees) {
          rank = 2; // Pending Fees only
          reasonDetails.push('All required documents verified');
          reasonDetails.push(`Pending fee payment of ₹${pendingFeeSum}`);
        } else if (hasPendingDocs && !hasPendingFees) {
          rank = 3; // Pending Documents only
          reasonDetails.push(`Missing required documents: ${missingReqDocNames.join(', ')}`);
          reasonDetails.push('All fees paid or no fees pending');
        } else {
          reasonDetails.push(`Missing documents: ${missingReqDocNames.join(', ')}`);
          reasonDetails.push(`Pending fee payment of ₹${pendingFeeSum}`);
        }

        const daysInactive = differenceInDays(today, adm.updatedAt);

        return {
          admissionNo: adm.admissionNo || 'DRAFT',
          studentName: adm.student.fullNameEn,
          grade: adm.grade?.name || 'N/A',
          campus: adm.campus?.name || 'N/A',
          rank,
          reasons: reasonDetails,
          daysInactive,
          missingDocuments: missingReqDocNames,
          pendingFeeSum
        };
      });

      // Sort prioritized queue by rank (1 to 5) then by inactive days (higher inactivity is prioritized or vice versa, let's sort by rank first)
      prioritizedQueue.sort((a, b) => a.rank - b.rank);

      // 9. Bottlenecks Identification
      const bottlenecks: any[] = [];

      // Document bottlenecks
      const missingDocStudents = prioritizedQueue.filter(q => q.missingDocuments.length > 0);
      if (missingDocStudents.length > 0) {
        bottlenecks.push({
          issue: 'Missing Required Documents Blocking Admission',
          affectedCount: missingDocStudents.length,
          students: missingDocStudents.slice(0, 5).map(s => `${s.studentName} (${s.missingDocuments.length} missing)`),
          action: 'Contact parents or verify pending uploads to clear document blockages.'
        });
      }

      // Fees bottlenecks
      const pendingFeeStudents = prioritizedQueue.filter(q => q.pendingFeeSum > 0);
      if (pendingFeeStudents.length > 0) {
        bottlenecks.push({
          issue: 'Outstanding Payments Preventing Admission Confirmation',
          affectedCount: pendingFeeStudents.length,
          students: pendingFeeStudents.slice(0, 5).map(s => `${s.studentName} (Pending: ₹${s.pendingFeeSum})`),
          action: 'Issue fee reminders to parents to proceed with admission confirmation.'
        });
      }

      // Transport allocation bottlenecks
      if (pendingTransport.length > 0) {
        bottlenecks.push({
          issue: 'Transport Allocation Pending',
          affectedCount: pendingTransport.length,
          students: pendingTransport.slice(0, 5).map(t => `${t.admission.student.fullNameEn} (${t.admission.grade?.name})`),
          action: 'Assign routes, stop stages, and bus routes for these transport requests.'
        });
      }

      // Inactivity bottlenecks
      const inactiveStudents = prioritizedQueue.filter(q => q.daysInactive >= 5);
      if (inactiveStudents.length > 0) {
        bottlenecks.push({
          issue: 'Inactive Application Drafts (5+ Days No Activity)',
          affectedCount: inactiveStudents.length,
          students: inactiveStudents.slice(0, 5).map(s => `${s.studentName} (${s.daysInactive} days inactive)`),
          action: 'Follow up with admission staff or parents to check if they wish to proceed.'
        });
      }

      // 10. Recommended Next Actions with Business Reasons
      const recommendedActions: any[] = [];

      if (prioritizedQueue.some(q => q.rank === 1)) {
        const count = prioritizedQueue.filter(q => q.rank === 1).length;
        recommendedActions.push({
          action: `Approve ${count} Ready Admissions`,
          reason: 'These students have verified documents, paid fees, and seats are available. They are ready to be fully admitted.'
        });
      }

      if (missingDocStudents.length > 0) {
        recommendedActions.push({
          action: 'Collect Missing Required Documents',
          reason: `There are ${missingDocStudents.length} draft applications currently blocked due to unverified or missing required documents.`
        });
      }

      if (pendingFeeStudents.length > 0) {
        const totalPendingFee = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        recommendedActions.push({
          action: `Recover Outstanding Fees (₹${totalPendingFee} pending)`,
          reason: `${pendingFeeStudents.length} students have pending fee collections. Clearing this recovers outstanding school revenue.`
        });
      }

      const gradesAlmostFull = seatSummary.filter(s => s.isAlmostFull);
      if (gradesAlmostFull.length > 0) {
        recommendedActions.push({
          action: 'Review Seat Allocations for High-Demand Grades',
          reason: `Grades ${gradesAlmostFull.map(g => `${g.grade} (${g.available} seats left)`).join(', ')} are almost at full capacity.`
        });
      }

      if (pendingTransport.length > 0) {
        recommendedActions.push({
          action: `Assign Transport Routes for ${pendingTransport.length} Students`,
          reason: 'Students have requested transport but have not yet been assigned to a route, stop, or vehicle.'
        });
      }

      // Audit Log
      if (context?.userId) {
        await createAuditLog({
          actorUserId: context.userId,
          action: 'READ',
          entityType: 'AdmissionApplication',
          entityId: 'AI_BRIEFING',
          newValue: { tool: 'get_daily_ai_briefing' }
        }).catch(() => {});
      }

      return {
        status: 'success',
        summary: {
          registrationsToday: regsToday.length,
          admissionsConfirmedToday: admsToday.length,
          totalPendingDocuments: pendingDocs.length,
          totalPendingFeeSum: pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0),
          transportPendingAllocation: pendingTransport.length
        },
        seatAvailability: seatSummary.map(s => ({
          grade: s.grade,
          campus: s.campus,
          availableSeats: s.available,
          status: s.available === 0 ? 'Full' : s.available <= 5 ? 'Almost Full' : 'Available'
        })),
        prioritizedQueue: prioritizedQueue.map(q => ({
          studentName: q.studentName,
          admissionNo: q.admissionNo,
          grade: q.grade,
          campus: q.campus,
          priorityStatus: q.rank === 1 ? 'Priority 1: Ready for Approval' :
                          q.rank === 2 ? 'Priority 2: Pending Fees' :
                          q.rank === 3 ? 'Priority 3: Pending Documents' :
                          q.rank === 4 ? 'Priority 4: Pending Both' : 'Priority 5: No Vacancy',
          reasons: q.reasons
        })),
        bottlenecks,
        recommendedActions
      };

    } catch (error) {
      console.error('Error in getDailyAiBriefingTool:', error);
      return { status: 'error', message: 'An error occurred while compiling the daily briefing.' };
    }
  }
};
