const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanupTestData() {
  try {
    console.log("Starting cleanup of test data...\n");

    // Find all registrations with duplicate admissions
    const registrationsWithDuplicateAdmissions = await prisma.registration.findMany({
      include: {
        admissions: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    let deletedAdmissionsCount = 0;

    for (const reg of registrationsWithDuplicateAdmissions) {
      if (reg.admissions.length > 1) {
        console.log(
          `Found registration "${reg.studentName}" (${reg.registrationNo}) with ${reg.admissions.length} admissions`
        );

        // Keep the first one, delete the rest
        const toDelete = reg.admissions.slice(1);

        for (const admission of toDelete) {
          console.log(`  - Deleting duplicate admission ${admission.id}`);

          // Delete related data first
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

          // Delete the admission
          await prisma.admissionApplication.delete({
            where: { id: admission.id },
          });

          deletedAdmissionsCount++;
        }
      }
    }

    // Find test registrations by student name
    console.log("\n\nCleaning up test registrations...");

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

    let deletedRegistrationsCount = 0;

    if (testRegistrations.length === 0) {
      console.log("No test registrations found.");
    } else {
      console.log(`Found ${testRegistrations.length} test registrations.\n`);

      for (const reg of testRegistrations) {
        console.log(`Deleting: "${reg.studentName}" (${reg.registrationNo})`);

        // Delete admissions and related data
        for (const admission of reg.admissions) {
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
    console.log(`✓ Duplicate admissions deleted: ${deletedAdmissionsCount}`);
    console.log(`✓ Test registrations deleted: ${deletedRegistrationsCount}`);
    console.log("✓ Cleanup completed successfully!");
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();
