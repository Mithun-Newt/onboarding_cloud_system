const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning up transactional test data...");

  // Delete in dependency-respecting order:
  await prisma.admissionStatusHistory.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.transportRequest.deleteMany({});
  await prisma.previousSchoolDetail.deleteMany({});
  await prisma.studentDocument.deleteMany({});
  await prisma.studentMedicalProfile.deleteMany({});
  await prisma.admissionApplication.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.family.deleteMany({});
  await prisma.auditLog.deleteMany({});

  console.log("✅ Database cleared of all registrations, admissions, and test student records successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Error clearing database test data:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
