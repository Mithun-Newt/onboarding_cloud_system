"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { RoleName, AdmissionStatus } from "@prisma/client";

interface IssueTCInput {
  tcNumber: string;
  tcDate: string;
  destinationSchool: string;
  reason: string;
}

export async function issueTC(admissionId: string, data: IssueTCInput) {
  try {
    const session = await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);

    const admission = await prisma.admissionApplication.findUnique({
      where: { id: admissionId },
      include: { tc: true },
    });

    if (!admission) throw new Error("Admission record not found");
    if (admission.status !== AdmissionStatus.CONFIRMED) {
      throw new Error("TC can only be issued for confirmed admissions");
    }
    if (admission.tc) throw new Error("A Transfer Certificate (TC) has already been issued for this student");

    // Perform database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create TC Record
      const tc = await tx.transferCertificate.create({
        data: {
          admissionId,
          tcNumber: data.tcNumber,
          tcDate: new Date(data.tcDate),
          destinationSchool: data.destinationSchool,
          reason: data.reason,
        },
      });

      // 2. Update Admission status to TC_ISSUED
      await tx.admissionApplication.update({
        where: { id: admissionId },
        data: { status: AdmissionStatus.TC_ISSUED },
      });

      // 3. Add to status history
      await tx.admissionStatusHistory.create({
        data: {
          admissionId,
          fromStatus: AdmissionStatus.CONFIRMED,
          toStatus: AdmissionStatus.TC_ISSUED,
          changedByUser: session.user.username,
          reason: `TC Issued: ${data.reason}`,
        },
      });

      // 4. Create Audit Log
      await createAuditLog({
        actorUserId: session.user.id,
        action: "ISSUE_TC",
        entityType: "AdmissionApplication",
        entityId: admissionId,
        oldValue: { status: AdmissionStatus.CONFIRMED },
        newValue: { status: AdmissionStatus.TC_ISSUED, tcNumber: data.tcNumber },
      });

      return tc;
    });

    revalidatePath("/dashboard");
    revalidatePath("/admissions");
    revalidatePath(`/admissions/${admissionId}`);

    return { success: true, tc: result };
  } catch (err: any) {
    console.error("Error issuing TC:", err);
    throw new Error(err.message || "Failed to issue Transfer Certificate");
  }
}

export async function getTC(admissionId: string) {
  try {
    return await prisma.transferCertificate.findUnique({
      where: { admissionId },
    });
  } catch (err) {
    console.error("Error fetching TC:", err);
    return null;
  }
}
