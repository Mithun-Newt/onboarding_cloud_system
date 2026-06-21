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
      // Return empty array, let user Rollover or wait for seed
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
        rows.map((row) => {
          const isNew = row.id.startsWith("new-");
          if (isNew) {
            return prisma.cohortStrength.create({
              data: {
                className: row.className,
                promotedStrength: parseInt(row.promotedStrength) || 0,
                tc: parseInt(row.tc) || 0,
                newAdmission: parseInt(row.newAdmission) || 0,
                target: parseInt(row.target) || 0,
                sortOrder: row.sortOrder,
                academicYearId: academicYearId,
              }
            });
          } else {
            return prisma.cohortStrength.update({
              where: { id: row.id },
              data: {
                promotedStrength: parseInt(row.promotedStrength) || 0,
                tc: parseInt(row.tc) || 0,
                newAdmission: parseInt(row.newAdmission) || 0,
                target: parseInt(row.target) || 0,
              },
            });
          }
        })
      );

      // Also sync targets to GradeSeatCapacity for reports and other logic
      const grades = await prisma.grade.findMany();
      const campus = await prisma.campus.findFirst();
      if (campus) {
        for (const row of rows) {
          const grade = grades.find(g => g.name === row.className);
          if (grade) {
            await prisma.gradeSeatCapacity.upsert({
              where: {
                academicYearId_gradeId_campusId: {
                  academicYearId,
                  gradeId: grade.id,
                  campusId: campus.id
                }
              },
              update: { totalSeats: parseInt(row.target) || 0 },
              create: {
                academicYearId,
                gradeId: grade.id,
                campusId: campus.id,
                totalSeats: parseInt(row.target) || 0
              }
            });
          }
        }
      }

    revalidatePath("/dashboard");
    return { success: true };
    } catch (err: any) {
      console.error("Error saving cohort strengths:", err);
      return { success: false, error: err.message || "Failed to save cohort strengths" };
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

export async function getRolloverStrengths(academicYearId: string) {
  try {
    await requireRole([RoleName.SYSTEM_ADMIN, RoleName.TIC, RoleName.ADMISSION_STAFF]);

    // Find the current year details
    const targetYear = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
    if (!targetYear) throw new Error("Academic year not found");

    // Find the immediately preceding year
    const previousYear = await prisma.academicYear.findFirst({
      where: { startYear: targetYear.startYear - 1 },
    });

    if (!previousYear) {
      throw new Error("No previous academic year found to rollover from");
    }

    // Get the previous year's cohort strengths
    const previousStrengths = await prisma.cohortStrength.findMany({
      where: { academicYearId: previousYear.id },
    });

    if (previousStrengths.length === 0) {
      throw new Error("Previous academic year has no cohort data");
    }

    // Also need the actual confirmed admissions from the previous year
    const previousAdmissions = await prisma.admissionApplication.groupBy({
      by: ["gradeId"],
      where: { academicYearId: previousYear.id, status: "CONFIRMED" },
      _count: { id: true },
    });

    const grades = await prisma.grade.findMany();
    const admittedByGrade = previousAdmissions.reduce((acc, a) => {
      acc[a.gradeId] = a._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Calculate the final Achieved numbers for the previous year
    const previousAchieved: Record<string, number> = {};
    for (const c of previousStrengths) {
      const grade = grades.find(g => g.name === c.className);
      const admitted = grade ? (admittedByGrade[grade.id] || 0) : 0;
      previousAchieved[c.className] = c.promotedStrength - c.tc + c.newAdmission + admitted;
    }

    // Define the progression mapping
    // Format: oldClassName -> newClassName
    const progressionMap: Record<string, string> = {
      "KG 1 (PRE-KG)": "KG 2 (JKG)",
      "KG 2 (JKG)": "KG 3 (SKG)",
      "KG 3 (SKG)": "Grade 1 - YAAZH", // Can be manually split to Grade 1 ACS by user
      "Grade 1 - YAAZH": "Grade 2 (YAAZH & VEENAI)",
      "Grade 1 (ACS)": "Grade 2 (ACS)",
      "Grade 2 (YAAZH & VEENAI)": "Grade 3",
      "Grade 2 (ACS)": "Grade 3 (ACS)",
      "Grade 3": "Grade 4",
      "Grade 3 (ACS)": "Grade 4 (ACS)",
      "Grade 4": "Grade 5 Yaazh",
      "Grade 4 (ACS)": "Grade 5 (ACS)",
      "Grade 5 Yaazh": "Grade 6",
      "Grade 5 (ACS)": "Grade 6", // Merging ACS back to main or separate? Assuming merging to main for now.
      "Grade 6": "Grade 7",
      "Grade 7": "Grade 8",
      "Grade 8": "Grade 9",
      "Grade 9": "Grade 10",
      "Grade 10": "Grade 11",
      "Grade 11": "12 Bio/Math", // Let user split into Math/CS and Arts
    };

    // Calculate new Promoted Strengths
    const newPromotedStrengths: Record<string, number> = {};
    for (const [oldClass, newClass] of Object.entries(progressionMap)) {
      if (previousAchieved[oldClass]) {
        newPromotedStrengths[newClass] = (newPromotedStrengths[newClass] || 0) + previousAchieved[oldClass];
      }
    }

    // Return the newly mapped rows (but don't save to DB yet)
    // We fetch the current target year rows to maintain IDs if they exist, or generate temporary ones
    const currentStrengths = await prisma.cohortStrength.findMany({
      where: { academicYearId },
      orderBy: { sortOrder: "asc" },
    });

    // If current strengths are empty, we map them based on the 22 grades
    const orderedGrades = [...grades].sort((a, b) => a.sortOrder - b.sortOrder);
    
    const resultRows = orderedGrades.map(g => {
      const existing = currentStrengths.find(c => c.className === g.name);
      const previous = previousStrengths.find(c => c.className === g.name);
      return {
        id: existing?.id || "new-" + g.id,
        className: g.name,
        promotedStrength: newPromotedStrengths[g.name] || 0,
        tc: 0,
        newAdmission: 0,
        target: existing?.target || previous?.target || 70, // Maintain existing target or copy from previous year
        sortOrder: g.sortOrder,
        academicYearId,
      };
    });

    return { success: true, data: resultRows };
  } catch (err: any) {
    console.error("Error calculating rollover strengths:", err);
    return { success: false, error: err.message || "Failed to calculate rollover strengths" };
  }
}
