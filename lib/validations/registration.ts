import { z } from "zod";

export const registrationSchema = z
  .object({
    academicYearId: z.string().min(1, "Academic year is required"),
    campusId: z.string().min(1, "Campus is required"),
    gradeId: z.string().min(1, "Grade is required"),
    givenName: z.string().min(1, "Given name is required"),
    studentName: z.string().optional(),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    ageRelaxation: z.boolean().optional().default(false),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], { required_error: "Gender is required" }),
    referredStudentType: z.string().optional(),
    referredStudentName: z.string().optional(),
    referredStudentGrade: z.string().optional(),
    fatherName: z.string().optional(),
    fatherMobile: z.string().optional(),
    motherName: z.string().optional(),
    motherMobile: z.string().optional(),
    primaryContact: z.string().optional(),
    prevSchoolName: z.string().optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pinCode: z.string().optional(),
    enquirySourceId: z.string().optional(),
    specialSupport: z.boolean().default(false),
    specialDetails: z.string().optional(),
    staffRemarks: z.string().optional(),
  })
  .refine(
    (data) => {
      return !!(data.fatherMobile || data.motherMobile || data.primaryContact);
    },
    { message: "At least one parent/guardian contact number is required", path: ["primaryContact"] }
  )
  .refine(
    (data) => {
      if (data.specialSupport && !data.specialDetails) return false;
      return true;
    },
    { message: "Special support details are required when special support is Yes", path: ["specialDetails"] }
  )
  .refine(
    (data) => {
      if ((data.referredStudentType === "SIBLING" || data.referredStudentType === "RELATIVE") && !data.referredStudentName) {
        return false;
      }
      return true;
    },
    { message: "Referenced student name is required", path: ["referredStudentName"] }
  )
  .refine(
    (data) => {
      if ((data.referredStudentType === "SIBLING" || data.referredStudentType === "RELATIVE") && !data.referredStudentGrade) {
        return false;
      }
      return true;
    },
    { message: "Referenced student grade is required", path: ["referredStudentGrade"] }
  );


export type RegistrationInput = z.infer<typeof registrationSchema>;
