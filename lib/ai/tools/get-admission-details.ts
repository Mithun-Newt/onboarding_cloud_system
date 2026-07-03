import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';
import { nullOrMessage } from '@/lib/ai/utils/response-helpers';

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

export const getAdmissionDetailsTool: AIToolConfig<typeof schema> = {
  name: 'get_admission_details',
  description: 'Fetch the complete admission summary including family/parents, medical details, transport details, and previous school details.',
  schema,
  isReadOnly: true,
  execute: async (args, context) => {
    const rawQuery = args.query || args.studentName || args.name || args.admissionNo || args.admissionNumber || args.registrationNo || args.registrationNumber || args.aadhaar || args.emis || args.parentMobile;

    if (!rawQuery) {
      return { status: 'error', message: 'Missing search term. Please provide a name, admission number, registration number, Aadhaar, EMIS, or mobile.' };
    }
    
    const searchQuery = rawQuery.trim();
    // Auto-correct AMD to ADM for fuzzy search
    const cleanQuery = searchQuery.replace(/^AMD-/i, 'ADM-').replace(/^REG-/i, 'REG-');
    
    try {
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
              family: { include: { guardians: true } },
              medicalProfile: true,
            }
          },
          prevSchool: true,
          transportReq: { include: { route: true, stop: true } },
          grade: true,
          campus: true
        },
        take: 3
      });

      if (context?.userId) {
        await createAuditLog({
          actorUserId: context.userId,
          action: 'READ',
          entityType: 'AdmissionApplication',
          entityId: 'AI_SEARCH',
          newValue: { query: args.query, resultsCount: records.length },
        }).catch(() => {});
      }

      if (!records.length) {
        return { status: 'no_results', message: `No admission records found for '${searchQuery}'.` };
      }

      return {
        status: 'success',
        data: records.map(r => ({
          admissionNo: nullOrMessage(r.admissionNo, 'DRAFT'),
          status: nullOrMessage(r.status, 'N/A'),
          campus: nullOrMessage(r.campus?.name, 'Unknown'),
          grade: nullOrMessage(r.grade?.name, 'Unknown'),
          createdAt: r.createdAt.toISOString(),
          student: {
            name: nullOrMessage(r.student.fullNameEn, 'N/A'),
            gender: nullOrMessage(r.student.gender, 'N/A'),
            dateOfBirth: nullOrMessage(r.student.dateOfBirth?.toISOString().split('T')[0], 'N/A'),
            bloodGroup: nullOrMessage(r.student.bloodGroup, 'N/A'),
            religion: nullOrMessage(r.student.religion, 'N/A'),
            community: nullOrMessage(r.student.community, 'N/A'),
            category: nullOrMessage(r.student.category, 'N/A'),
            nationality: nullOrMessage(r.student.nationality, 'N/A'),
            motherTongue: nullOrMessage(r.student.motherTongue, 'N/A'),
            emisNumber: nullOrMessage(r.student.emisNumber, 'N/A'),
            aadhaarNo: nullOrMessage(r.student.aadhaarNo, 'N/A'),
            address: `${r.student.address1 || ''} ${r.student.address2 || ''} ${r.student.city || ''} ${r.student.state || ''} ${r.student.pinCode || ''}`.trim() || 'N/A',
          },
          parents: r.student.family?.guardians.map(g => ({
            relation: nullOrMessage(g.relationship, 'N/A'),
            name: nullOrMessage(g.fullName, 'N/A'),
            mobile: nullOrMessage(g.mobile, 'N/A'),
            email: nullOrMessage(g.email, 'N/A'),
            education: nullOrMessage(g.education, 'N/A'),
            occupation: nullOrMessage(g.occupation, 'N/A'),
            isPrimary: g.isPrimary,
          })) || [],
          medical: r.student.medicalProfile ? {
            walkingStatus: nullOrMessage(r.student.medicalProfile.walkingStatus, 'N/A'),
            speechStatus: nullOrMessage(r.student.medicalProfile.speechStatus, 'N/A'),
            hasAllergies: r.student.medicalProfile.hasAllergies,
            allergyDetails: nullOrMessage(r.student.medicalProfile.allergyDetails, 'N/A'),
            healthIssues: nullOrMessage(r.student.medicalProfile.healthIssues, 'N/A'),
            needsMedication: r.student.medicalProfile.needsMedication,
            medicationDetails: nullOrMessage(r.student.medicalProfile.medicationDetails, 'N/A'),
            specialAttention: nullOrMessage(r.student.medicalProfile.specialAttention, 'N/A'),
          } : 'No Medical Profile',
          transport: r.transportReq?.required ? {
            required: true,
            route: nullOrMessage(r.transportReq.route?.name, 'N/A'),
            routeNo: nullOrMessage(r.transportReq.route?.routeNo, 'N/A'),
            stop: nullOrMessage(r.transportReq.stop?.stopName, 'N/A'),
            distance: nullOrMessage(r.transportReq.stop?.distance, 'N/A'),
            busNo: nullOrMessage(r.transportReq.busNo, 'N/A'),
            remarks: nullOrMessage(r.transportReq.remarks, 'N/A'),
          } : { required: false },
          previousSchool: r.prevSchool ? {
            schoolName: nullOrMessage(r.prevSchool.schoolName, 'N/A'),
            schoolAddress: nullOrMessage(r.prevSchool.schoolAddress, 'N/A'),
            lastClassPassed: nullOrMessage(r.prevSchool.lastClassPassed, 'N/A'),
            prevAcademicYear: nullOrMessage(r.prevSchool.prevAcademicYear, 'N/A'),
            tcNumber: nullOrMessage(r.prevSchool.tcNumber, 'N/A'),
            awards: nullOrMessage(r.prevSchool.awards, 'N/A'),
          } : 'None'
        }))
      };
    } catch (error) {
      console.error('Error in getAdmissionDetailsTool:', error);
      return { status: 'error', message: 'An error occurred while fetching admission details.' };
    }
  }
};
