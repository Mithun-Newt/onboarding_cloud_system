import { z } from "zod";

export const admissionStudentSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required"),
    fullNameEn: z.string().optional(),
    fullNameTa: z.string().optional(),
    givenName: z.string().optional(),
    surname: z.string().optional(),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    bloodGroup: z.string().optional(),
    religion: z.string().optional(),
    community: z.string().optional(),
    category: z.string().optional(),
    motherTongue: z.string().optional(),
    nationality: z.string().default("Indian"),
    emisNumber: z.string().optional(),
    aadhaarLast4: z.string().max(4).optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pinCode: z.string().optional(),
    referredStudentType: z.string().optional(),
    referredStudentName: z.string().optional(),
    referredStudentGrade: z.string().optional(),
  })
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


export const admissionParentSchema = z.object({
  fatherName: z.string().optional(),
  fatherMobile: z.string().optional(),
  fatherEmail: z.string().email().optional().or(z.literal("")),
  fatherEducation: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherIncome: z.string().optional(),
  motherName: z.string().optional(),
  motherMobile: z.string().optional(),
  motherEmail: z.string().email().optional().or(z.literal("")),
  motherEducation: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherIncome: z.string().optional(),
  guardianName: z.string().optional(),
  guardianRelationship: z.string().optional(),
  guardianEducation: z.string().optional(),
  guardianOccupation: z.string().optional(),
  primaryContactPerson: z.enum(["FATHER", "MOTHER", "GUARDIAN"]).default("FATHER"),
});

export const admissionPrevSchoolSchema = z.object({
  schoolName: z.string().optional(),
  schoolAddress: z.string().optional(),
  lastClassPassed: z.string().optional(),
  prevAcademicYear: z.string().optional(),
  tcNumber: z.string().optional(),
  awards: z.string().optional(),
});

export const admissionMedicalSchema = z.object({
  walkingStatus: z.string().optional(),
  speechStatus: z.string().optional(),
  hasAllergies: z.boolean().default(false),
  allergyDetails: z.string().optional(),
  healthIssues: z.string().optional(),
  needsMedication: z.boolean().default(false),
  medicationDetails: z.string().optional(),
  specialAttention: z.string().optional(),
});

export const admissionTransportSchema = z.object({
  required: z.boolean().default(false),
  routeId: z.string().optional(),
  stopId: z.string().optional(),
  remarks: z.string().optional(),
});

export const paymentSchema = z
  .object({
    feeType: z.string().min(1, "Fee type is required"),
    amount: z.number().min(0, "Amount must be >= 0"),
    paymentMode: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE", "WAIVER"]),
    paymentDate: z.string().optional(),
    chequeNo: z.string().optional(),
    bankName: z.string().optional(),
    upiRef: z.string().optional(),
    waiverReason: z.string().optional(),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.paymentMode === "WAIVER" && !data.waiverReason) return false;
      return true;
    },
    { message: "Waiver reason is required for waived payments", path: ["waiverReason"] }
  );

export type PaymentInput = z.infer<typeof paymentSchema>;
