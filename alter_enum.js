const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "AdmissionStatus" ADD VALUE 'TC_ISSUED'`);
    console.log("Enum updated successfully");
  } catch (e) {
    if (e.message.includes("already exists")) {
       console.log("Enum value already exists, skipping.");
    } else {
       console.error("Failed:", e);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
