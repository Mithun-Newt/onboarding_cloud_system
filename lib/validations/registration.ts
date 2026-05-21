import { z } from "zod";

export const registrationSchema = z
  .object({
    academicYearId: z.string().min(1, "Academic year is required"),
    campusId: z.string().min(1, "Campus is required"),
    gradeId: z.string().min(1, "Grade is required"),
    studentName: z.string().min(2, "Student name is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"], { required_error: "Gender is required" }),
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
  );

export type RegistrationInput = z.infer<typeof registrationSchema>;
