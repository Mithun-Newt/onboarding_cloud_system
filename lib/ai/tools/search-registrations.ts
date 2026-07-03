import { z } from 'zod';
import { getRegistrations } from '@/features/registrations/actions';
import { AIToolConfig } from '../types';
import { createAuditLog } from '@/lib/audit';
import { nullOrMessage } from '@/lib/ai/utils/response-helpers';

const searchSchema = z.object({
  query: z.string().optional().describe('General search query (name, mobile, or registration number)'),
  studentName: z.string().optional().describe('Search by student name'),
  student_name: z.string().optional().describe('Search by student name (snake_case)'),
  name: z.string().optional().describe('Alias for student name'),
  registrationNo: z.string().optional().describe('Search by exact registration number'),
  registrationNumber: z.string().optional().describe('Alias for registration number'),
  registration_number: z.string().optional().describe('Alias for registration number (snake_case)'),
  regNo: z.string().optional().describe('Alias for registration number (short)'),
  reg_no: z.string().optional().describe('Alias for registration number (short, snake_case)'),
  admissionNo: z.string().optional().describe('Filter by exact admission number'),
  admissionNumber: z.string().optional().describe('Alias for admission number'),
  admission_number: z.string().optional().describe('Alias for admission number (snake_case)'),
  admNo: z.string().optional().describe('Alias for admission number (short)'),
  adm_no: z.string().optional().describe('Alias for admission number (short, snake_case)'),
  search: z.string().optional().describe('Search text'),
  searchText: z.string().optional().describe('Search text (camelCase)'),
  search_text: z.string().optional().describe('Search text (snake_case)'),
  search_type: z.string().optional().describe('Type of search'),
  search_by: z.string().optional().describe('Field to search by'),
  search_field: z.string().optional().describe('Field to search in'),
  searchBy: z.string().optional().describe('Field to search by (camelCase)'),
  searchType: z.string().optional().describe('Type of search (camelCase)'),
  search_method: z.string().optional().describe('Method of search'),
  searchMethod: z.string().optional().describe('Method of search (camelCase)'),
  query_type: z.string().optional().describe('Type of query'),
  queryType: z.string().optional().describe('Type of query (camelCase)'),
  type: z.string().optional().describe('Type indicator'),
  filter: z.string().optional().describe('Filter value'),
  mobile: z.string().optional().describe('Search by parent mobile number'),
  fatherName: z.string().optional().describe('Search by father name'),
  father_name: z.string().optional().describe('Search by father name (snake_case)'),
  fatherMobile: z.string().optional().describe('Search by father mobile number'),
  father_mobile: z.string().optional().describe('Search by father mobile number (snake_case)'),
  motherName: z.string().optional().describe('Search by mother name'),
  mother_name: z.string().optional().describe('Search by mother name (snake_case)'),
  motherMobile: z.string().optional().describe('Search by mother mobile number'),
  mother_mobile: z.string().optional().describe('Search by mother mobile number (snake_case)'),
});

export const commonSearchParams = searchSchema.shape;

export const searchRegistrationsTool: AIToolConfig<typeof searchSchema> = {
  name: 'search_registrations',
  description: 'Search student registrations using name, registration number, or mobile. Use this tool to check what grade a student registered for, or if they have a registration.',
  schema: searchSchema,
  isReadOnly: true,
  execute: async (args, context) => {
    if (!args) {
      return { status: 'error', message: 'Missing search arguments.' };
    }
    
    const rawQuery = args.query || args.studentName || args.student_name || args.name || args.registrationNo || args.registrationNumber || args.registration_number || args.regNo || args.reg_no || args.admissionNo || args.admissionNumber || args.admission_number || args.admNo || args.adm_no || args.search || args.searchText || args.search_text || args.mobile || args.fatherName || args.father_name || args.motherName || args.mother_name || args.fatherMobile || args.father_mobile || args.motherMobile || args.mother_mobile || args.filter || args.search_method || args.searchMethod || args.query_type || args.queryType || Object.values(args).find(v => typeof v === 'string');
    
    if (!rawQuery) {
      return { status: 'error', message: 'Missing search query. Please provide a name, registration number, or mobile number.' };
    }

    const searchQuery = String(rawQuery).trim().replace(/^AMD-/i, 'ADM-').replace(/^REG-/i, 'REG-');

    // 1. Reuse existing logic
    const results = await getRegistrations({ search: searchQuery, pageSize: 5 });
    
    // 2. Audit logging
    if (context?.userId) {
      await createAuditLog({
        actorUserId: context.userId,
        action: 'READ',
        entityType: 'Registration',
        entityId: 'AI_SEARCH',
        newValue: { query: args.query, resultsCount: results.items.length },
      }).catch(console.error); // Fire and forget so we don't block
    }

    // 3. Compact AI-friendly JSON
    if (!results.items || results.items.length === 0) {
      return { status: 'no_results', message: `No registrations found for '${args.query}'` };
    }

    const compactData = results.items.map(reg => ({
      registrationNo: nullOrMessage(reg.registrationNo, 'N/A'),
      studentName: nullOrMessage(reg.studentName, 'N/A'),
      status: nullOrMessage(reg.status, 'N/A'),
      gender: nullOrMessage(reg.gender, 'N/A'),
      dateOfBirth: nullOrMessage(reg.dateOfBirth?.toISOString().split('T')[0], 'N/A'),
      primaryContact: nullOrMessage(reg.primaryContact, 'N/A'),
      grade: nullOrMessage(reg.grade?.name, 'N/A'),
      campus: nullOrMessage(reg.campus?.name, 'N/A'),
      fatherName: nullOrMessage(reg.fatherName, 'N/A'),
      fatherMobile: nullOrMessage(reg.fatherMobile, 'N/A'),
      motherName: nullOrMessage(reg.motherName, 'N/A'),
      motherMobile: nullOrMessage(reg.motherMobile, 'N/A'),
      prevSchoolName: nullOrMessage(reg.prevSchoolName, 'N/A'),
      address: `${reg.address1 || ''} ${reg.address2 || ''} ${reg.city || ''} ${reg.state || ''} ${reg.pinCode || ''}`.trim() || 'N/A',
      parentRemarks: nullOrMessage(reg.parentRemarks, 'N/A'),
      staffRemarks: nullOrMessage(reg.staffRemarks, 'N/A'),
      specialSupport: reg.specialSupport,
      specialDetails: nullOrMessage(reg.specialDetails, 'N/A'),
      ageRelaxation: reg.ageRelaxation,
    }));

    return {
      status: 'success',
      totalFound: results.total,
      showing: compactData.length,
      data: compactData,
    };
  }
};
