"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { RoleName } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

export async function hardDeleteFullRecord(params: { registrationId?: string; admissionId?: string }) {
  await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC]);

  const { registrationId, admissionId } = params;
  if (!registrationId && !admissionId) throw new Error("Must provide either registrationId or admissionId");

  let regId = registrationId;
  let admId = admissionId;

  // Find the links
  if (!regId && admId) {
    const adm = await prisma.admissionApplication.findUnique({ where: { id: admId } });
    if (adm) regId = adm.registrationId;
  }
  if (!admId && regId) {
    const adm = await prisma.admissionApplication.findFirst({ where: { registrationId: regId } });
    if (adm) admId = adm.id;
  }

  // Get full details to delete
  const admission = admId ? await prisma.admissionApplication.findUnique({ where: { id: admId } }) : null;
  const registration = regId ? await prisma.registration.findUnique({ where: { id: regId } }) : null;

  if (!admission && !registration) throw new Error("Record not found");

  const studentId = admission?.studentId || registration?.studentId;

  // 1. Decrement Cohort if confirmed
  if (admission && admission.status === "CONFIRMED") {
    // Find the cohort strength for that grade and academic year
    const grade = await prisma.grade.findUnique({ where: { id: admission.gradeId } });
    if (grade) {
      const cohort = await prisma.cohortStrength.findUnique({
        where: {
          className_academicYearId: {
            className: grade.name,
            academicYearId: admission.academicYearId,
          },
        },
      });
      if (cohort && cohort.newAdmission > 0) {
        await prisma.cohortStrength.update({
          where: { id: cohort.id },
          data: { newAdmission: { decrement: 1 } },
        });
      }
    }
  }

  // 2. Prune documents from cloud if any
  if (studentId) {
    const docs = await prisma.studentDocument.findMany({ where: { studentId } });
    for (const doc of docs) {
      if (doc.filePath && doc.filePath.includes("res.cloudinary.com") && process.env.CLOUDINARY_URL) {
        try {
          const match = doc.filePath.match(/students\/([^/]+)\/([^.]+)/);
          if (match) {
            await cloudinary.uploader.destroy(`students/${match[1]}/${match[2]}`);
          }
        } catch (e) {
          console.error("Cloudinary delete failed:", e);
        }
      }
    }
  }

  // 3. Delete in correct order (child tables first)
  await prisma.$transaction(async (tx) => {
    if (admId) {
      await tx.admissionStatusHistory.deleteMany({ where: { admissionId: admId } });
      await tx.previousSchoolDetail.deleteMany({ where: { admissionId: admId } });
      await tx.transportRequest.deleteMany({ where: { admissionId: admId } });
      await tx.payment.deleteMany({ where: { admissionId: admId } });
    }

    if (studentId) {
      await tx.studentMedicalProfile.deleteMany({ where: { studentId } });
      await tx.studentVaccination.deleteMany({ where: { studentId } });
      await tx.studentDocument.deleteMany({ where: { studentId } });
      await tx.siblingRelative.deleteMany({ where: { studentId } });
    }

    if (admId) {
      await tx.admissionApplication.delete({ where: { id: admId } });
    }

    if (regId) {
      await tx.registration.delete({ where: { id: regId } });
    }

    if (studentId) {
      const student = await tx.student.findUnique({ where: { id: studentId } });
      if (student) {
        await tx.student.delete({ where: { id: studentId } });
        if (student.familyId) {
          // Check if family has other students
          const otherStudents = await tx.student.count({ where: { familyId: student.familyId } });
          if (otherStudents === 0) {
            await tx.guardian.deleteMany({ where: { familyId: student.familyId } });
            await tx.family.delete({ where: { id: student.familyId } });
          }
        }
      }
    }
  });

  revalidatePath("/admissions");
  revalidatePath("/registrations");
  revalidatePath("/dashboard");
}
