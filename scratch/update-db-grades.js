const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Updating database grades...");

  // Update Pre-KG
  await prisma.grade.updateMany({
    where: { name: "Pre-KG" },
    data: { name: "KG 1 (PRE-KG)", sortOrder: 1 },
  });

  // Update LKG
  await prisma.grade.updateMany({
    where: { name: "LKG" },
    data: { name: "KG 2 (JKG)", sortOrder: 2 },
  });

  // Update UKG
  await prisma.grade.updateMany({
    where: { name: "UKG" },
    data: { name: "KG 3 (SKG)", sortOrder: 3 },
  });

  // Update Grade 1
  await prisma.grade.updateMany({
    where: { name: "Grade 1" },
    data: { name: "Grade 1 - YAAZH", sortOrder: 4 },
  });

  // Update Grade 2 (making space for ACS sort order)
  await prisma.grade.updateMany({
    where: { name: "Grade 2" },
    data: { name: "Grade 2 (YAAZH & VEENAI)", sortOrder: 6 },
  });

  // Create Grade 1 (ACS) if it doesn't exist
  const g1acs = await prisma.grade.findFirst({ where: { name: "Grade 1 (ACS)" } });
  if (!g1acs) {
    await prisma.grade.create({
      data: { name: "Grade 1 (ACS)", sortOrder: 5, isActive: true },
    });
    console.log("➕ Created Grade 1 (ACS)");
  }

  // Create Grade 2 (ACS) if it doesn't exist
  const g2acs = await prisma.grade.findFirst({ where: { name: "Grade 2 (ACS)" } });
  if (!g2acs) {
    await prisma.grade.create({
      data: { name: "Grade 2 (ACS)", sortOrder: 7, isActive: true },
    });
    console.log("➕ Created Grade 2 (ACS)");
  }

  // Delete all existing cohort strengths so that they are cleanly re-initialized with new names
  const deletedCohorts = await prisma.cohortStrength.deleteMany({});
  console.log(`🧹 Deleted ${deletedCohorts.count} existing cohort rows to trigger re-seed.`);

  console.log("✅ Grade names and cohort configurations updated successfully in the database.");
}

main()
  .catch((e) => {
    console.error("❌ Error updating database grades:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
