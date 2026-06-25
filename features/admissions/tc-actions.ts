"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { RoleName, AdmissionStatus } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

export async function issueTransferCertificate(admissionId: string) {
  const session = await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);

  const admission = await prisma.admissionApplication.findUnique({
    where: { id: admissionId },
    include: { student: { include: { documents: true } } }
  });

  if (!admission) throw new Error("Admission not found");
  if (admission.status !== AdmissionStatus.CONFIRMED) {
    throw new Error("Only confirmed admissions can be issued a TC");
  }

  // Update status to TC_ISSUED bypassing Prisma client validation
  await prisma.$executeRaw`UPDATE "admission_applications" SET "status" = 'TC_ISSUED' WHERE "id" = ${admissionId}`;

  // Prune documents from Cloudinary
  const documents = admission.student?.documents || [];
  for (const doc of documents) {
    if (doc.filePath) {
      if (doc.filePath.includes("res.cloudinary.com")) {
        try {
          const match = doc.filePath.match(/students\/([^/]+)\/([^.]+)/);
          if (match) {
            const publicId = `students/${match[1]}/${match[2]}`;
            if (process.env.CLOUDINARY_URL) {
              await cloudinary.uploader.destroy(publicId);
            }
          }
        } catch (e) {
          console.error("Failed to delete from cloudinary:", e);
        }
      }
      // Update db record to show it was pruned
      await prisma.studentDocument.update({
        where: { id: doc.id },
        data: { filePath: null, remarks: "File pruned due to TC Issuance" }
      });
    }
  }

  await createAuditLog({
    actorUserId: session.user.id,
    action: "ISSUE_TC",
    entityType: "AdmissionApplication",
    entityId: admission.id,
    // @ts-ignore
    newValue: { status: "TC_ISSUED" },
  });

  revalidatePath(`/admissions/${admissionId}`);
  revalidatePath("/admissions");
}
