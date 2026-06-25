"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { registrationSchema } from "@/lib/validations/registration";
import { generateSequenceNumber, formatRegistrationNo, getAcademicYearCode, getEligibleGradeName } from "@/lib/utils";
import { RegistrationStatus, RoleName } from "@prisma/client";


export async function createRegistration(formData: unknown) {
  try {
    const session = await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);
    const data = registrationSchema.parse(formData);

    if (data.ageRelaxation) {
      const dobParts = data.dateOfBirth.split("-");
      const birthMonth = dobParts[1] ? parseInt(dobParts[1], 10) : null;
      if (birthMonth !== 4 && birthMonth !== 5 && birthMonth !== 6) {
        throw new Error("Age relaxation cannot be applied because this Date of Birth is beyond the June 30 threshold.");
      }
    }

    const academicYear = await prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
    if (!academicYear) throw new Error("Academic year not found");

    // Validate DOB and Grade mapping
    const dob = new Date(data.dateOfBirth);
    const eligibleGradeName = getEligibleGradeName(dob, academicYear.startYear, data.ageRelaxation);
    
    const selectedGrade = await prisma.grade.findUnique({ where: { id: data.gradeId } });
    if (!selectedGrade) throw new Error("Selected grade not found");

    if (!eligibleGradeName) {
      const targetMonthIndex = data.ageRelaxation ? 5 : 2;
      const targetDay = data.ageRelaxation ? 30 : 31;
      const targetMonthName = data.ageRelaxation ? "June 30" : "March 31";
      const targetDate = new Date(academicYear.startYear, targetMonthIndex, targetDay);
      let age = targetDate.getFullYear() - dob.getFullYear();
      const m = targetDate.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && targetDate.getDate() < dob.getDate())) {
        age--;
      }
      throw new Error(`Student's age of ${age} years is not eligible for admission. Students must be between 3 and 17 years old as of ${targetMonthName}, ${academicYear.startYear}.`);
    }

      let isEligible = false;
      if (eligibleGradeName === "KG 1 (PRE-KG)") {
        isEligible = selectedGrade.name.includes("KG 1") || selectedGrade.name.includes("PRE-KG");
      } else if (eligibleGradeName === "KG 2 (JKG)") {
        isEligible = selectedGrade.name.includes("KG 2") || selectedGrade.name.includes("JKG");
      } else {
        // For ages 5 and older: can choose any grade from SKG to Grade 12
        if (selectedGrade.name.includes("KG 1") || selectedGrade.name.includes("PRE-KG") || selectedGrade.name.includes("KG 2") || selectedGrade.name.includes("JKG")) {
          isEligible = false;
        } else {
          isEligible = true;
        }
      }

      if (!isEligible) {
        throw new Error(`The student's age is eligible only for "${eligibleGradeName}". Selected grade "${selectedGrade.name}" is invalid for their age.`);
      }

    const normalizedStudentName = data.givenName.trim();

    const yearCode = getAcademicYearCode(academicYear.label);
    const seq = await generateSequenceNumber("REGISTRATION", yearCode);
    const registrationNo = formatRegistrationNo(yearCode, seq);

    const registration = await prisma.registration.create({
      data: {
        registrationNo,
        academicYearId: data.academicYearId,
        campusId: data.campusId,
        gradeId: data.gradeId,
        studentName: normalizedStudentName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender as any,
        referredStudentType: data.referredStudentType || null,
        referredStudentName: data.referredStudentName || null,
        referredStudentGrade: data.referredStudentGrade || null,
        fatherName: data.fatherName,
        fatherMobile: data.fatherMobile,
        motherName: data.motherName,
        motherMobile: data.motherMobile,
        primaryContact: data.primaryContact,
        prevSchoolName: data.prevSchoolName,
        address1: data.address1,
        address1Ta: data.address1Ta,
        address2: data.address2,
        address2Ta: data.address2Ta,
        city: data.city,
        cityTa: data.cityTa,
        state: data.state,
        pinCode: data.pinCode,
        enquirySourceId: data.enquirySourceId || null,
        parentRemarks: data.parentRemarks,
        specialSupport: data.specialSupport,
        specialDetails: data.specialDetails,
        ageRelaxation: data.ageRelaxation,
        staffRemarks: data.staffRemarks === "NONE" ? null : data.staffRemarks,
      },
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "CREATE",
      entityType: "Registration",
      entityId: registration.id,
      newValue: { registrationNo, studentName: data.studentName },
    });

    revalidatePath("/registrations");
    return { success: true, data: registration };
  } catch (error) {
    console.error("CREATE_REGISTRATION_ERROR:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create registration" };
  }
}

export async function updateRegistration(id: string, formData: unknown) {
  try {
    const session = await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);
    const data = registrationSchema.parse(formData);

    if (data.ageRelaxation) {
      const dobParts = data.dateOfBirth.split("-");
      const birthMonth = dobParts[1] ? parseInt(dobParts[1], 10) : null;
      if (birthMonth !== 4 && birthMonth !== 5 && birthMonth !== 6) {
        throw new Error("Age relaxation cannot be applied because this Date of Birth is beyond the June 30 threshold.");
      }
    }

    const old = await prisma.registration.findUnique({ where: { id } });
    if (!old) throw new Error("Registration not found");

    const academicYear = await prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
    if (!academicYear) throw new Error("Academic year not found");

    // Validate DOB and Grade mapping
    const dob = new Date(data.dateOfBirth);
    const eligibleGradeName = getEligibleGradeName(dob, academicYear.startYear, data.ageRelaxation);
    
    const selectedGrade = await prisma.grade.findUnique({ where: { id: data.gradeId } });
    if (!selectedGrade) throw new Error("Selected grade not found");

    if (!eligibleGradeName) {
      const targetMonthIndex = data.ageRelaxation ? 5 : 2;
      const targetDay = data.ageRelaxation ? 30 : 31;
      const targetMonthName = data.ageRelaxation ? "June 30" : "March 31";
      const targetDate = new Date(academicYear.startYear, targetMonthIndex, targetDay);
      let age = targetDate.getFullYear() - dob.getFullYear();
      const m = targetDate.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && targetDate.getDate() < dob.getDate())) {
        age--;
      }
      throw new Error(`Student's age of ${age} years is not eligible for admission. Students must be between 3 and 17 years old as of ${targetMonthName}, ${academicYear.startYear}.`);
    }

      let isEligible = false;
      if (eligibleGradeName === "KG 1 (PRE-KG)") {
        isEligible = selectedGrade.name.includes("KG 1") || selectedGrade.name.includes("PRE-KG");
      } else if (eligibleGradeName === "KG 2 (JKG)") {
        isEligible = selectedGrade.name.includes("KG 2") || selectedGrade.name.includes("JKG");
      } else {
        // For ages 5 and older: can choose any grade from SKG to Grade 12
        if (selectedGrade.name.includes("KG 1") || selectedGrade.name.includes("PRE-KG") || selectedGrade.name.includes("KG 2") || selectedGrade.name.includes("JKG")) {
          isEligible = false;
        } else {
          isEligible = true;
        }
      }

      if (!isEligible) {
        throw new Error(`The student's age is eligible only for "${eligibleGradeName}". Selected grade "${selectedGrade.name}" is invalid for their age.`);
      }

    const normalizedStudentName = data.givenName.trim();

    const registration = await prisma.registration.update({
      where: { id },
      data: {
        academicYearId: data.academicYearId,
        campusId: data.campusId,
        gradeId: data.gradeId,
        studentName: normalizedStudentName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender as any,
        referredStudentType: data.referredStudentType || null,
        referredStudentName: data.referredStudentName || null,
        referredStudentGrade: data.referredStudentGrade || null,
        fatherName: data.fatherName,
        fatherMobile: data.fatherMobile,
        motherName: data.motherName,
        motherMobile: data.motherMobile,
        primaryContact: data.primaryContact,
        prevSchoolName: data.prevSchoolName,
        address1: data.address1,
        address1Ta: data.address1Ta,
        address2: data.address2,
        address2Ta: data.address2Ta,
        city: data.city,
        cityTa: data.cityTa,
        state: data.state,
        pinCode: data.pinCode,
        enquirySourceId: data.enquirySourceId || null,
        parentRemarks: data.parentRemarks,
        specialSupport: data.specialSupport,
        specialDetails: data.specialDetails,
        ageRelaxation: data.ageRelaxation,
        staffRemarks: data.staffRemarks === "NONE" ? null : data.staffRemarks,
      },
    });

    if (old.studentId) {
      await prisma.student.update({
        where: { id: old.studentId },
        data: {
          fullNameEn: normalizedStudentName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender as any,
          address1: data.address1,
          address1Ta: data.address1Ta,
          address2: data.address2,
          address2Ta: data.address2Ta,
          city: data.city,
          cityTa: data.cityTa,
          state: data.state,
          pinCode: data.pinCode,
          referredStudentType: data.referredStudentType || null,
          referredStudentName: data.referredStudentName || null,
          referredStudentGrade: data.referredStudentGrade || null,
        },
      });
    }

    await createAuditLog({
      actorUserId: session.user.id,
      action: "UPDATE",
      entityType: "Registration",
      entityId: id,
      oldValue: { studentName: old.studentName },
      newValue: { studentName: data.studentName },
    });

    revalidatePath("/registrations");
    revalidatePath(`/registrations/${id}`);

    if (old.studentId) {
      const admission = await prisma.admissionApplication.findFirst({
        where: { studentId: old.studentId },
      });
      if (admission) {
        revalidatePath(`/admissions/${admission.id}`);
      }
    }

    return { success: true, data: registration };
  } catch (error) {
    console.error("UPDATE_REGISTRATION_ERROR:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update registration" };
  }
}

export async function cancelRegistration(id: string, reason: string) {
  try {
    const session = await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);
    const reg = await prisma.registration.findUnique({ where: { id } });
    if (!reg) throw new Error("Registration not found");
    if (reg.status === RegistrationStatus.ADMITTED)
      throw new Error("Cannot cancel an admitted registration");

    await prisma.registration.update({
      where: { id },
      data: { status: RegistrationStatus.CANCELLED, staffRemarks: reason },
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "CANCEL",
      entityType: "Registration",
      entityId: id,
      newValue: { reason },
    });

    revalidatePath("/registrations");
    revalidatePath(`/registrations/${id}`);
  } catch (error) {
    console.error("CANCEL_REGISTRATION_ERROR:", error);
    throw error instanceof Error ? error : new Error("Failed to cancel registration");
  }
}

export async function getRegistrations(params: {
  academicYearId?: string;
  gradeId?: string;
  status?: string;
  search?: string;
  hasPriority?: string | boolean;
  ageRelaxation?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.academicYearId) where.academicYearId = params.academicYearId;
    if (params.gradeId) where.gradeId = params.gradeId;
    if (params.status) where.status = params.status;
    if (params.ageRelaxation !== undefined && params.ageRelaxation !== "") {
      where.ageRelaxation = params.ageRelaxation === "true";
    }

    const andConditions: any[] = [];

    if (params.hasPriority !== undefined && params.hasPriority !== "") {
      const isPriority = params.hasPriority === "true" || params.hasPriority === true;
      if (isPriority) {
        andConditions.push({ referredStudentType: { in: ["SIBLING", "RELATIVE"] } });
      } else {
        andConditions.push({
          OR: [
            { referredStudentType: null },
            { referredStudentType: "NEW_STUDENT" }
          ]
        });
      }
    }

    if (params.search) {
      andConditions.push({
        OR: [
          { studentName: { contains: params.search, mode: "insensitive" } },
          { registrationNo: { contains: params.search, mode: "insensitive" } },
          { fatherMobile: { contains: params.search } },
          { motherMobile: { contains: params.search } },
        ]
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [items, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: {
          grade: true,
          academicYear: true,
          campus: true,
          enquirySource: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.registration.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    console.error("GET_REGISTRATIONS_ERROR:", error);
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }
}

export async function checkDuplicate(studentName: string, dateOfBirth: string, mobile: string) {
  try {
    const count = await prisma.registration.count({
      where: {
        AND: [
          { studentName: { equals: studentName, mode: "insensitive" } },
          { dateOfBirth: new Date(dateOfBirth) },
          {
            OR: [
              { fatherMobile: mobile },
              { motherMobile: mobile },
              { primaryContact: mobile },
            ],
          },
        ],
      },
    });
    return count > 0;
  } catch (error) {
    console.error("CHECK_DUPLICATE_ERROR:", error);
    return false;
  }
}

export async function deleteRegistration(id: string) {
  try {
    const session = await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);
    const reg = await prisma.registration.findUnique({
      where: { id },
      include: {
        admissions: true,
        student: true,
      },
    });
    if (!reg) throw new Error("Registration not found");    const { hardDeleteFullRecord } = await import("@/features/admissions/delete-actions");
    await hardDeleteFullRecord({ registrationId: id });
    
    await createAuditLog({
      actorUserId: session.user.id,
      action: "DELETE",
      entityType: "Registration",
      entityId: id,
      oldValue: { registrationId: id },
    });

    revalidatePath("/registrations");
  } catch (error) {
    console.error("DELETE_REGISTRATION_ERROR:", error);
    throw error instanceof Error ? error : new Error("Failed to delete registration");
  }
}
