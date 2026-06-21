import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const cohorts = await prisma.cohortStrength.findMany();
  console.log(cohorts.length, 'cohorts found');
  console.log(cohorts.map(c => c.className).join(', '));
}
main().finally(() => prisma.$disconnect());
