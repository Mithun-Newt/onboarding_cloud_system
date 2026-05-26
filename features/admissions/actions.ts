"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { RoleName, AdmissionStatus, RegistrationStatus } from "@prisma/client";
import { generateSequenceNumber, formatAdmissionNo, getAcademicYearCode } from "@/lib/utils";
import { getConfirmationFeeForGrade } from "@/lib/fee-constants";

export async function createAdmission(registrationId: string) {
  try {
    const session = await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);

    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { academicYear: true, grade: true },
    });
    if (!reg) throw new Error("Registration not found");
    if (reg.status === RegistrationStatus.ADMITTED) throw new Error("Already admitted");
    if (reg.status === RegistrationStatus.CANCELLED) throw new Error("Registration is cancelled");

    // Check if an admission already exists for this registration (prevent duplicates)
    const existingAdmission = await prisma.admissionApplication.findFirst({
      where: { registrationId },
    });
    if (existingAdmission) throw new Error("Admission already exists for this registration");

    const student = await prisma.student.create({
      data: {
        fullNameEn: reg.studentName,
        dateOfBirth: reg.dateOfBirth,
        gender: reg.gender,
        address1: reg.address1,
        address2: reg.address2,
        city: reg.city,
        state: reg.state,
        pinCode: reg.pinCode,
        referredStudentType: reg.referredStudentType,
        referredStudentName: reg.referredStudentName,
        referredStudentGrade: reg.referredStudentGrade,
      },
    });

    const admission = await prisma.admissionApplication.create({
      data: {
        registrationId,
        academicYearId: reg.academicYearId,
        campusId: reg.campusId,
        gradeId: reg.gradeId,
        studentId: student.id,
        status: AdmissionStatus.DRAFT,
      },
    });

    // Create default grade-based confirmation fee payment record (PENDING status)
    const confirmationFeeAmount = getConfirmationFeeForGrade(reg.grade.name);
    await prisma.payment.create({
      data: {
        admissionId: admission.id,
        feeType: "Confirmation Fee",
        amount: confirmationFeeAmount,
        paymentMode: "CASH",
        paymentStatus: "PENDING",
      },
    });

    await prisma.registration.update({
      where: { id: registrationId },
      data: { status: RegistrationStatus.ADMISSION_STARTED, studentId: student.id },
    });

    await prisma.admissionStatusHistory.create({
      data: {
        admissionId: admission.id,
        toStatus: AdmissionStatus.DRAFT,
        changedByUser: session.user.id,
      },
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "CREATE",
      entityType: "AdmissionApplication",
      entityId: admission.id,
      newValue: { registrationId, studentId: student.id },
    });

    revalidatePath("/admissions");
    revalidatePath(`/registrations/${registrationId}`);
    return admission;
  } catch (error) {
    console.error("CREATE_ADMISSION_ERROR:", error);
    throw error instanceof Error ? error : new Error("Failed to create admission");
  }
}

export async function updateAdmissionStudent(admissionId: string, data: any) {
  try {
    const session = await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);
    const admission = await prisma.admissionApplication.findUnique({
      where: { id: admissionId },
    });
    if (!admission) throw new Error("Admission not found");

    let normalizedFullName = data.fullNameEn;
    if (data.firstName && data.lastName) {
      const fullNameEn = `${data.firstName} ${data.middleName || ""}`.trim() + ` ${data.lastName}`;
      normalizedFullName = fullNameEn.replace(/\s+/g, ' ').trim();
    }

    await prisma.student.update({
      where: { id: admission.studentId },
      data: {
        fullNameEn: normalizedFullName,
        fullNameTa: data.fullNameTa,
        givenName: data.givenName,
        surname: data.surname,

        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        religion: data.religion,
        community: data.community,
        category: data.category,
        motherTongue: data.motherTongue,
        nationality: data.nationality,
        emisNumber: data.emisNumber,
        aadhaarLast4: data.aadhaarLast4,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        referredStudentType: data.referredStudentType || null,
        referredStudentName: data.referredStudentName || null,
        referredStudentGrade: data.referredStudentGrade || null,
      },
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "UPDATE_STUDENT",
      entityType: "AdmissionApplication",
      entityId: admissionId,
    });

    revalidatePath(`/admissions/${admissionId}`);
  } catch (error) {
    console.error("UPDATE_ADMISSION_STUDENT_ERROR:", error);
    throw error instanceof Error ? error : new Error("Failed to update student");
  }
}

export async function updateAdmissionFamily(admissionId: string, data: any) {
  const session = await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);
  const admission = await prisma.admissionApplication.findUnique({
    where: { id: admissionId },
    include: { student: { include: { family: { include: { guardians: true } } } } },
  });
  if (!admission) throw new Error("Admission not found");

  let familyId = admission.student.familyId;

  if (!familyId) {
    const family = await prisma.family.create({ data: {} });
    familyId = family.id;
    await prisma.student.update({ where: { id: admission.studentId }, data: { familyId } });
  }

  const existingGuardians = admission.student.family?.guardians ?? [];
  await prisma.guardian.deleteMany({ where: { familyId } });

  const guardians = [];
  if (data.fatherName) {
    guardians.push({
      familyId,
      relationship: "FATHER",
      fullName: data.fatherName,
      mobile: data.fatherMobile,
      email: data.fatherEmail,
      education: data.fatherEducation,
      occupation: data.fatherOccupation,
      annualIncome: data.fatherIncome ? parseFloat(data.fatherIncome) : null,
      isPrimary: data.primaryContactPerson === "FATHER",
    });
  }
  if (data.motherName) {
    guardians.push({
      familyId,
      relationship: "MOTHER",
      fullName: data.motherName,
      mobile: data.motherMobile,
      email: data.motherEmail,
      education: data.motherEducation,
      occupation: data.motherOccupation,
      annualIncome: data.motherIncome ? parseFloat(data.motherIncome) : null,
      isPrimary: data.primaryContactPerson === "MOTHER",
    });
  }
  if (data.guardianName) {
    guardians.push({
      familyId,
      relationship: data.guardianRelationship || "GUARDIAN",
      fullName: data.guardianName,
      education: data.guardianEducation,
      occupation: data.guardianOccupation,
      isPrimary: data.primaryContactPerson === "GUARDIAN",
    });
  }

  if (guardians.length > 0) {
    await prisma.guardian.createMany({ data: guardians });
  }

  revalidatePath(`/admissions/${admissionId}`);
}

export async function updateAdmissionPrevSchool(admissionId: string, data: any) {
  await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);
  await prisma.previousSchoolDetail.upsert({
    where: { admissionId },
    update: data,
    create: { admissionId, ...data },
  });
  revalidatePath(`/admissions/${admissionId}`);
}

export async function updateAdmissionMedical(admissionId: string, data: any) {
  const session = await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);
  const admission = await prisma.admissionApplication.findUnique({ where: { id: admissionId } });
  if (!admission) throw new Error("Not found");

  await prisma.studentMedicalProfile.upsert({
    where: { studentId: admission.studentId },
    update: data,
    create: { studentId: admission.studentId, ...data },
  });

  revalidatePath(`/admissions/${admissionId}`);
}

export async function confirmAdmission(admissionId: string) {
  const session = await requireRole([
    RoleName.SYSTEM_ADMIN,
    RoleName.TIC,
    RoleName.ADMISSION_STAFF,
  ]);

  const admission = await prisma.admissionApplication.findUnique({
    where: { id: admissionId },
    include: {
      registration: { include: { academicYear: true } },
      student: { include: { documents: true } },
      payments: true,
    },
  });
  if (!admission) throw new Error("Admission not found");
  if (admission.status !== AdmissionStatus.DRAFT) throw new Error("Only DRAFT admissions can be confirmed");

  const requiredDocs = await prisma.documentType.findMany({ where: { isRequired: true, isActive: true } });
  for (const dt of requiredDocs) {
    const doc = admission.student.documents.find((d) => d.documentTypeId === dt.id);
    if (!doc || (doc.status !== "VERIFIED" && doc.status !== "WAIVED")) {
      throw new Error(`Required document "${dt.name}" is not verified or waived`);
    }
  }

  const pendingConfirmationFee = admission.payments.find(
    (p) => p.feeType === "Confirmation Fee" && (p.paymentStatus === "PENDING" || p.paymentStatus === "PARTIAL")
  );
  if (pendingConfirmationFee) {
    throw new Error("Confirmation Fee is pending. Collect payment or record waiver before confirming.");
  }

  const yearCode = getAcademicYearCode(admission.registration.academicYear.label);
  const seq = await generateSequenceNumber("ADMISSION", yearCode);
  const admissionNo = formatAdmissionNo(yearCode, seq);

  await prisma.admissionApplication.update({
    where: { id: admissionId },
    data: {
      admissionNo,
      status: AdmissionStatus.CONFIRMED,
      confirmedAt: new Date(),
      confirmedByUserId: session.user.id,
    },
  });

  await prisma.registration.update({
    where: { id: admission.registrationId },
    data: { status: RegistrationStatus.ADMITTED },
  });

  await prisma.admissionStatusHistory.create({
    data: {
      admissionId,
      fromStatus: AdmissionStatus.DRAFT,
      toStatus: AdmissionStatus.CONFIRMED,
      changedByUser: session.user.id,
    },
  });

  await createAuditLog({
    actorUserId: session.user.id,
    action: "CONFIRM",
    entityType: "AdmissionApplication",
    entityId: admissionId,
    newValue: { admissionNo },
  });

  revalidatePath("/admissions");
  revalidatePath(`/admissions/${admissionId}`);
  return { admissionNo };
}

export async function cancelAdmission(admissionId: string, reason: string) {
  const session = await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);
  const admission = await prisma.admissionApplication.findUnique({ where: { id: admissionId } });
  if (!admission) throw new Error("Not found");
  if (admission.status === AdmissionStatus.CANCELLED) throw new Error("Already cancelled");

  await prisma.admissionApplication.update({
    where: { id: admissionId },
    data: {
      status: AdmissionStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  });

  await prisma.admissionStatusHistory.create({
    data: {
      admissionId,
      fromStatus: admission.status,
      toStatus: AdmissionStatus.CANCELLED,
      changedByUser: session.user.id,
      reason,
    },
  });

  await prisma.registration.update({
    where: { id: admission.registrationId },
    data: { status: RegistrationStatus.REGISTERED },
  });

  revalidatePath("/admissions");
  revalidatePath(`/admissions/${admissionId}`);
}

export async function getAdmissions(params: {
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
        { admissionNo: { contains: params.search, mode: "insensitive" } },
        { student: { fullNameEn: { contains: params.search, mode: "insensitive" } } },
        { registration: { registrationNo: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.admissionApplication.findMany({
        where,
        include: { grade: true, academicYear: true, campus: true, student: { select: { fullNameEn: true, dateOfBirth: true, gender: true } }, registration: { select: { registrationNo: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.admissionApplication.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    console.error("GET_ADMISSIONS_ERROR:", error);
    return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }
}

export async function saveTransportRequest(
  admissionId: string,
  data: {
    required: boolean;
    routeId?: string | null;
    stopId?: string | null;
    remarks?: string | null;
  }
) {
  try {
    const session = await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);

    const admission = await prisma.admissionApplication.findUnique({
      where: { id: admissionId },
    });
    if (!admission) throw new Error("Admission not found");

    // 1. Update/Upsert TransportRequest
    await prisma.transportRequest.upsert({
      where: { admissionId },
      update: {
        required: data.required,
        routeId: data.required ? data.routeId : null,
        stopId: data.required ? data.stopId : null,
        remarks: data.remarks ?? null,
      },
      create: {
        admissionId,
        required: data.required,
        routeId: data.required ? data.routeId : null,
        stopId: data.required ? data.stopId : null,
        remarks: data.remarks ?? null,
      },
    });



    await createAuditLog({
      actorUserId: session.user.id,
      action: "UPDATE_TRANSPORT",
      entityType: "AdmissionApplication",
      entityId: admissionId,
      newValue: { required: data.required, routeId: data.routeId, stopId: data.stopId },
    });

    revalidatePath(`/admissions/${admissionId}`);
  } catch (error) {
    console.error("SAVE_TRANSPORT_REQUEST_ERROR:", error);
    throw error instanceof Error ? error : new Error("Failed to save transport details");
  }
}
