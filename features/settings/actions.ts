"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";

const ADMIN_ROLES: RoleName[] = [RoleName.SYSTEM_ADMIN, RoleName.TIC];

// ── Academic Years ──────────────────────────────────────────────────────────

export async function createAcademicYear(data: { label: string; startYear: number; endYear: number }) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const ay = await prisma.academicYear.create({ data });
    await createAuditLog({ actorUserId: session.user.id, action: "CREATE", entityType: "AcademicYear", entityId: ay.id, newValue: data });
    revalidatePath("/settings/academic-years");
    return { success: true, data: ay };
  } catch (error: any) {
    console.error("CREATE_ACADEMIC_YEAR_ERROR:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "An academic year with this start year already exists." };
    }
    return { success: false, error: "Failed to create academic year." };
  }
}

export async function setCurrentAcademicYear(id: string) {
  const session = await requireRole(ADMIN_ROLES);
  await prisma.academicYear.updateMany({ data: { isCurrent: false } });
  await prisma.academicYear.update({ where: { id }, data: { isCurrent: true, isActive: true } });
  await createAuditLog({ actorUserId: session.user.id, action: "SET_CURRENT", entityType: "AcademicYear", entityId: id });
  revalidatePath("/settings/academic-years");
  revalidatePath("/dashboard");
}

export async function deleteAcademicYear(id: string) {
  const session = await requireRole([RoleName.SYSTEM_ADMIN]);
  await prisma.academicYear.delete({ where: { id } });
  await createAuditLog({ actorUserId: session.user.id, action: "DELETE", entityType: "AcademicYear", entityId: id });
  revalidatePath("/settings/academic-years");
}

// ── Grades ──────────────────────────────────────────────────────────────────

export async function createGrade(data: { name: string; sortOrder: number }) {
  const session = await requireRole(ADMIN_ROLES);
  const g = await prisma.grade.create({ data });
  await createAuditLog({ actorUserId: session.user.id, action: "CREATE", entityType: "Grade", entityId: g.id, newValue: data });
  revalidatePath("/settings/grades");
  return g;
}

export async function updateGrade(id: string, data: { name: string; sortOrder: number; isActive: boolean }) {
  const session = await requireRole(ADMIN_ROLES);
  const g = await prisma.grade.update({ where: { id }, data });
  await createAuditLog({ actorUserId: session.user.id, action: "UPDATE", entityType: "Grade", entityId: id, newValue: data });
  revalidatePath("/settings/grades");
  return g;
}

// ── Document Types ──────────────────────────────────────────────────────────

export async function createDocumentType(data: { name: string; description?: string; isRequired: boolean }) {
  const session = await requireRole(ADMIN_ROLES);
  const dt = await prisma.documentType.create({ data });
  await createAuditLog({ actorUserId: session.user.id, action: "CREATE", entityType: "DocumentType", entityId: dt.id, newValue: data });
  revalidatePath("/settings/document-types");
  return dt;
}

export async function updateDocumentType(id: string, data: { name: string; description?: string; isRequired: boolean; isActive: boolean }) {
  const session = await requireRole(ADMIN_ROLES);
  await prisma.documentType.update({ where: { id }, data });
  await createAuditLog({ actorUserId: session.user.id, action: "UPDATE", entityType: "DocumentType", entityId: id, newValue: data });
  revalidatePath("/settings/document-types");
}

// ── Enquiry Sources ──────────────────────────────────────────────────────────

export async function createEnquirySource(data: { name: string; type: string }) {
  const session = await requireRole(ADMIN_ROLES);
  const es = await prisma.enquirySource.create({ data: { name: data.name, type: data.type as any } });
  await createAuditLog({ actorUserId: session.user.id, action: "CREATE", entityType: "EnquirySource", entityId: es.id, newValue: data });
  revalidatePath("/settings/enquiry-sources");
  return es;
}

// ── Staff Users ──────────────────────────────────────────────────────────────

export async function createStaffUser(data: {
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
  roles: string[];
}) {
  const session = await requireRole([RoleName.SYSTEM_ADMIN]);
  const hash = await bcrypt.hash(data.password, 12);
  const user = await prisma.staffUser.create({
    data: {
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash: hash,
      mustChangePassword: true,
    },
  });

  const roles = await prisma.role.findMany({ where: { name: { in: data.roles as any[] } } });
  await prisma.staffUserRole.createMany({
    data: roles.map((r) => ({ staffUserId: user.id, roleId: r.id })),
  });

  await createAuditLog({
    actorUserId: session.user.id,
    action: "CREATE",
    entityType: "StaffUser",
    entityId: user.id,
    newValue: { username: data.username, roles: data.roles },
  });

  revalidatePath("/settings/users");
  return user;
}

export async function toggleStaffUserActive(id: string, isActive: boolean) {
  const session = await requireRole([RoleName.SYSTEM_ADMIN]);
  await prisma.staffUser.update({ where: { id }, data: { isActive } });
  await createAuditLog({
    actorUserId: session.user.id,
    action: isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
    entityType: "StaffUser",
    entityId: id,
  });
  revalidatePath("/settings/users");
}

export async function resetStaffPassword(id: string, newPassword: string) {
  const session = await requireRole([RoleName.SYSTEM_ADMIN]);
  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.staffUser.update({ where: { id }, data: { passwordHash: hash, mustChangePassword: true } });
  await createAuditLog({ actorUserId: session.user.id, action: "RESET_PASSWORD", entityType: "StaffUser", entityId: id });
  revalidatePath("/settings/users");
}

// ── Seat Capacity ──────────────────────────────────────────────────────────────

export async function upsertSeatCapacity(data: { academicYearId: string; gradeId: string; campusId: string; totalSeats: number }) {
  const session = await requireRole(ADMIN_ROLES);
  await prisma.gradeSeatCapacity.upsert({
    where: {
      academicYearId_gradeId_campusId: {
        academicYearId: data.academicYearId,
        gradeId: data.gradeId,
        campusId: data.campusId,
      },
    },
    update: { totalSeats: data.totalSeats },
    create: data,
  });
  await createAuditLog({ actorUserId: session.user.id, action: "UPSERT", entityType: "GradeSeatCapacity", newValue: data });
  revalidatePath("/settings/seat-capacity");
}
