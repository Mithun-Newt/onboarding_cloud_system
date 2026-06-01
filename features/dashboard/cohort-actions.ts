"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { RoleName } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getCohortStrengths(academicYearId: string) {
  try {
    let strengths = await prisma.cohortStrength.findMany({
      where: { academicYearId },
      orderBy: { sortOrder: "asc" },
    });

    if (strengths.length === 0) {
      // Pre-populate with screenshots default values
      const defaultData = [
        { className: "KG 1 (PRE-KG)", promotedStrength: 0, tc: 0, newAdmission: 47, target: 60, sortOrder: 1 },
        { className: "KG 2 (JKG)", promotedStrength: 34, tc: 1, newAdmission: 36, target: 70, sortOrder: 2 },
        { className: "KG 3 (SKG)", promotedStrength: 50, tc: 6, newAdmission: 10, target: 70, sortOrder: 3 },
        { className: "Grade 1 - YAAZH", promotedStrength: 45, tc: 0, newAdmission: 2, target: 35, sortOrder: 4 },
        { className: "Grade 1 (ACS)", promotedStrength: 29, tc: 0, newAdmission: 1, target: 30, sortOrder: 5 },
        { className: "Grade 2 (YAAZH & VEENAI)", promotedStrength: 49, tc: 0, newAdmission: 11, target: 70, sortOrder: 6 },
        { className: "Grade 2 (ACS)", promotedStrength: 28, tc: 1, newAdmission: 0, target: 30, sortOrder: 7 },
      ];

      await prisma.$transaction(
        defaultData.map((row) =>
          prisma.cohortStrength.create({
            data: { ...row, academicYearId },
          })
        )
      );

      strengths = await prisma.cohortStrength.findMany({
        where: { academicYearId },
        orderBy: { sortOrder: "asc" },
      });
    }

    return strengths;
  } catch (err: any) {
    console.error("Error fetching cohort strengths:", err);
    return [];
  }
}

export async function saveCohortStrengths(academicYearId: string, rows: any[]) {
  try {
    await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);

    await prisma.$transaction(
      rows.map((row) =>
        prisma.cohortStrength.update({
          where: { id: row.id },
          data: {
            promotedStrength: parseInt(row.promotedStrength) || 0,
            tc: parseInt(row.tc) || 0,
            newAdmission: parseInt(row.newAdmission) || 0,
            target: parseInt(row.target) || 0,
          },
        })
      )
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error saving cohort strengths:", err);
    throw new Error(err.message || "Failed to save cohort strengths");
  }
}

export async function addCohortRow(academicYearId: string, className: string) {
  try {
    await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);

    // Find max sortOrder
    const maxRow = await prisma.cohortStrength.findFirst({
      where: { academicYearId },
      orderBy: { sortOrder: "desc" },
    });
    const nextSortOrder = (maxRow?.sortOrder ?? 0) + 1;

    const newRow = await prisma.cohortStrength.create({
      data: {
        className,
        academicYearId,
        sortOrder: nextSortOrder,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, row: newRow };
  } catch (err: any) {
    console.error("Error adding cohort row:", err);
    throw new Error(err.message || "Failed to add cohort row");
  }
}

export async function deleteCohortRow(rowId: string) {
  try {
    await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);

    await prisma.cohortStrength.delete({
      where: { id: rowId },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting cohort row:", err);
    throw new Error(err.message || "Failed to delete cohort row");
  }
}
