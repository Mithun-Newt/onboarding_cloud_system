import { prisma } from '../lib/prisma';

async function main() {
  const regs = await prisma.registration.findMany();
  console.log("ALL REGISTRATIONS:", JSON.stringify(regs, null, 2));
}

main().catch(console.error);
