const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up all dynamic data...");
  
  // 1. Delete transactional records
  await prisma.payment.deleteMany({});
  await prisma.admissionStatusHistory.deleteMany({});
  await prisma.previousSchoolDetail.deleteMany({});
  await prisma.transportRequest.deleteMany({});
  await prisma.studentDocument.deleteMany({});
  await prisma.studentMedicalProfile.deleteMany({});
  await prisma.studentVaccination.deleteMany({});
  await prisma.siblingRelative.deleteMany({});
  await prisma.admissionApplication.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.family.deleteMany({});
  await prisma.auditLog.deleteMany({});

  // 2. Delete non-default staff users (keep only admin)
  const adminUser = await prisma.staffUser.findUnique({
    where: { username: "admin" }
  });
  
  if (adminUser) {
    await prisma.staffUserRole.deleteMany({
      where: {
        NOT: { staffUserId: adminUser.id }
      }
    });
    await prisma.staffUser.deleteMany({
      where: {
        NOT: { id: adminUser.id }
      }
    });
  } else {
    await prisma.staffUserRole.deleteMany({});
    await prisma.staffUser.deleteMany({});
  }

  console.log("Database cleared successfully! Kept only default admin account, schools, campuses, academic years, roles, document types, vaccine types, enquiry sources, fee items, bus routes, and bus stops.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
