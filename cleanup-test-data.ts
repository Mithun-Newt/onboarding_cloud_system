import { prisma } from "@/lib/prisma";

async function cleanupTestData() {
  try {
    console.log("Starting cleanup of test data...");

    // Find all registrations with duplicate admissions
    const registrationsWithDuplicateAdmissions = await prisma.registration.findMany({
      include: {
        admissions: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    let deletedAdmissionsCount = 0;
    let deletedRegistrationsCount = 0;

    for (const reg of registrationsWithDuplicateAdmissions) {
      if (reg.admissions.length > 1) {
        console.log(
          `\nFound registration "${reg.studentName}" (${reg.registrationNo}) with ${reg.admissions.length} admissions`
        );

        // Keep the first one, delete the rest
        const toDelete = reg.admissions.slice(1);

        for (const admission of toDelete) {
          console.log(`  - Deleting admission ${admission.id} (created: ${admission.createdAt})`);

          // Delete related data first
          await prisma.payment.deleteMany({
            where: { admissionId: admission.id },
          });

          await prisma.admissionStatusHistory.deleteMany({
            where: { admissionId: admission.id },
          });

          await prisma.studentDocument.deleteMany({
            where: { studentId: admission.studentId },
          });

          await prisma.previousSchoolDetail.deleteMany({
            where: { admissionId: admission.id },
          });

          await prisma.studentMedicalProfile.deleteMany({
            where: { studentId: admission.studentId },
          });

          await prisma.transportRequest.deleteMany({
            where: { admissionId: admission.id },
          });

          // Delete the admission
          await prisma.admissionApplication.delete({
            where: { id: admission.id },
          });

          deletedAdmissionsCount++;
        }
      }
    }

    // Now delete duplicate students and related test registrations
    console.log("\n\nCleaning up standalone test data...");

    // Find registrations that have "test", "sample", "akhil", or "mithun" in the name (case-insensitive)
    const testRegistrations = await prisma.registration.findMany({
      where: {
        OR: [
          { studentName: { contains: "Akhil", mode: "insensitive" } },
          { studentName: { contains: "Mithun", mode: "insensitive" } },
          { studentName: { contains: "test", mode: "insensitive" } },
          { studentName: { contains: "sample", mode: "insensitive" } },
        ],
      },
      include: {
        admissions: true,
        student: {
          include: {
            documents: true,
            family: {
              include: { guardians: true },
            },
          },
        },
      },
    });

    if (testRegistrations.length === 0) {
      console.log("No test registrations found with common test names.");
    } else {
      console.log(`Found ${testRegistrations.length} test registrations to delete.`);

      for (const reg of testRegistrations) {
        console.log(`\nDeleting registration: "${reg.studentName}" (${reg.registrationNo})`);

        // Delete admissions and related data
        for (const admission of reg.admissions) {
          console.log(`  - Deleting admission ${admission.id}`);

          await prisma.payment.deleteMany({
            where: { admissionId: admission.id },
          });

          await prisma.admissionStatusHistory.deleteMany({
            where: { admissionId: admission.id },
          });

          await prisma.previousSchoolDetail.deleteMany({
            where: { admissionId: admission.id },
          });

          await prisma.transportRequest.deleteMany({
            where: { admissionId: admission.id },
          });

          await prisma.admissionApplication.delete({
            where: { id: admission.id },
          });
        }

        // Delete student and related data
        if (reg.student) {
          console.log(`  - Deleting student: ${reg.student.fullNameEn}`);

          await prisma.studentDocument.deleteMany({
            where: { studentId: reg.student.id },
          });

          await prisma.studentMedicalProfile.deleteMany({
            where: { studentId: reg.student.id },
          });

          await prisma.studentVaccination.deleteMany({
            where: { studentId: reg.student.id },
          });

          await prisma.siblingRelative.deleteMany({
            where: { studentId: reg.student.id },
          });

          if (reg.student.familyId) {
            await prisma.guardian.deleteMany({
              where: { familyId: reg.student.familyId },
            });

            const familyWithOtherStudents = await prisma.family.findUnique({
              where: { id: reg.student.familyId },
              include: { students: true },
            });

            if (familyWithOtherStudents && familyWithOtherStudents.students.length === 1) {
              await prisma.family.delete({
                where: { id: reg.student.familyId },
              });
            }
          }

          await prisma.student.delete({
            where: { id: reg.student.id },
          });
        }

        // Delete the registration
        await prisma.registration.delete({
          where: { id: reg.id },
        });

        deletedRegistrationsCount++;
      }
    }

    console.log("\n\n=== CLEANUP SUMMARY ===");
    console.log(`Duplicate admissions deleted: ${deletedAdmissionsCount}`);
    console.log(`Test registrations deleted: ${deletedRegistrationsCount}`);
    console.log("Cleanup completed successfully!");
  } catch (error) {
    console.error("Cleanup error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();
