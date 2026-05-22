"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { registrationSchema } from "@/lib/validations/registration";
import { generateSequenceNumber, formatRegistrationNo, getAcademicYearCode } from "@/lib/utils";
import { RegistrationStatus } from "@prisma/client";

export async function createRegistration(formData: unknown) {
  try {
    const session = await requireAuth();
    const data = registrationSchema.parse(formData);

    const academicYear = await prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
    if (!academicYear) throw new Error("Academic year not found");

    const yearCode = getAcademicYearCode(academicYear.label);
    const seq = await generateSequenceNumber("REGISTRATION", yearCode);
    const registrationNo = formatRegistrationNo(yearCode, seq);

    const registration = await prisma.registration.create({
      data: {
        registrationNo,
        academicYearId: data.academicYearId,
        campusId: data.campusId,
        gradeId: data.gradeId,
        studentName: data.studentName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender as any,
        fatherName: data.fatherName,
        fatherMobile: data.fatherMobile,
        motherName: data.motherName,
        motherMobile: data.motherMobile,
        primaryContact: data.primaryContact,
        prevSchoolName: data.prevSchoolName,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        enquirySourceId: data.enquirySourceId || null,
        specialSupport: data.specialSupport,
        specialDetails: data.specialDetails,
        staffRemarks: data.staffRemarks,
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
    return registration;
  } catch (error) {
    console.error("CREATE_REGISTRATION_ERROR:", error);
    throw error instanceof Error ? error : new Error("Failed to create registration");
  }
}

export async function updateRegistration(id: string, formData: unknown) {
  try {
    const session = await requireAuth();
    const data = registrationSchema.parse(formData);

    const old = await prisma.registration.findUnique({ where: { id } });
    if (!old) throw new Error("Registration not found");

    const registration = await prisma.registration.update({
      where: { id },
      data: {
        academicYearId: data.academicYearId,
        campusId: data.campusId,
        gradeId: data.gradeId,
        studentName: data.studentName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender as any,
        fatherName: data.fatherName,
        fatherMobile: data.fatherMobile,
        motherName: data.motherName,
        motherMobile: data.motherMobile,
        primaryContact: data.primaryContact,
        prevSchoolName: data.prevSchoolName,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        enquirySourceId: data.enquirySourceId || null,
        specialSupport: data.specialSupport,
        specialDetails: data.specialDetails,
        staffRemarks: data.staffRemarks,
      },
    });

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
    return registration;
  } catch (error) {
    console.error("UPDATE_REGISTRATION_ERROR:", error);
    throw error instanceof Error ? error : new Error("Failed to update registration");
  }
}

export async function cancelRegistration(id: string, reason: string) {
  try {
    const session = await requireAuth();
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
    if (params.search) {
      where.OR = [
        { studentName: { contains: params.search, mode: "insensitive" } },
        { registrationNo: { contains: params.search, mode: "insensitive" } },
        { fatherMobile: { contains: params.search } },
        { motherMobile: { contains: params.search } },
      ];
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
