import { PrismaClient, RoleName, EnquirySourceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // School
  const school = await prisma.school.upsert({
    where: { id: "school-default" },
    update: {},
    create: {
      id: "school-default",
      name: process.env.NEXT_PUBLIC_SCHOOL_NAME || "Junior School",
      address: "School Address, City - 600001",
      phone: "+91 00000 00000",
      email: "admin@school.edu.in",
    },
  });

  // Campus
  const campus = await prisma.campus.upsert({
    where: { id: "campus-main" },
    update: {},
    create: {
      id: "campus-main",
      schoolId: school.id,
      name: "Main Campus",
      address: "Main Campus Address",
    },
  });

  // Academic Year 2026-27
  const academicYear = await prisma.academicYear.upsert({
    where: { label: "2026-27" },
    update: {},
    create: {
      label: "2026-27",
      startYear: 2026,
      endYear: 2027,
      isActive: true,
      isCurrent: true,
    },
  });

  // Grades
  const gradeData = [
    { name: "Pre-KG", sortOrder: 1 },
    { name: "LKG", sortOrder: 2 },
    { name: "UKG", sortOrder: 3 },
    { name: "Grade 1", sortOrder: 4 },
    { name: "Grade 2", sortOrder: 5 },
  ];

  for (const g of gradeData) {
    await prisma.grade.upsert({
      where: { name: g.name },
      update: {},
      create: g,
    });
  }

  const grades = await prisma.grade.findMany({ orderBy: { sortOrder: "asc" } });

  // Seat capacity
  for (const grade of grades) {
    await prisma.gradeSeatCapacity.upsert({
      where: {
        academicYearId_gradeId_campusId: {
          academicYearId: academicYear.id,
          gradeId: grade.id,
          campusId: campus.id,
        },
      },
      update: {},
      create: {
        academicYearId: academicYear.id,
        gradeId: grade.id,
        campusId: campus.id,
        totalSeats: 40,
      },
    });
  }

  // Roles
  const roleNames = Object.values(RoleName);
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Document Types
  const docTypes = [
    { name: "Student Photo", isRequired: true },
    { name: "Birth Certificate", isRequired: true },
    { name: "Transfer Certificate", isRequired: false },
    { name: "Community Certificate", isRequired: false },
    { name: "Aadhaar Copy", isRequired: false },
    { name: "Previous School Report Card", isRequired: false },
    { name: "Other Document", isRequired: false },
  ];

  for (const dt of docTypes) {
    await prisma.documentType.upsert({
      where: { name: dt.name },
      update: {},
      create: dt,
    });
  }

  // Vaccine Types
  const vaccines = ["DPT", "Polio", "MMR", "Smallpox", "Hepatitis B"];
  for (const v of vaccines) {
    await prisma.vaccineType.upsert({
      where: { name: v },
      update: {},
      create: { name: v },
    });
  }

  // Enquiry Sources
  const sources = [
    { name: "Flyer", type: EnquirySourceType.FLYER },
    { name: "Parents Referral", type: EnquirySourceType.PARENTS },
    { name: "Sibling", type: EnquirySourceType.SIBLINGS },
    { name: "Self Walk-in", type: EnquirySourceType.SELF },
    { name: "Social Media", type: EnquirySourceType.SOCIAL_MEDIA },
    { name: "Website", type: EnquirySourceType.WEBSITE },
    { name: "Word of Mouth", type: EnquirySourceType.WORD_OF_MOUTH },
    { name: "Other", type: EnquirySourceType.OTHER },
  ];

  for (const s of sources) {
    await prisma.enquirySource.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }

  // Fee Items
  const feeItems = [
    { name: "Admission Fee", defaultAmount: 5000 },
    { name: "Tuition Fee (Annual)", defaultAmount: 30000 },
    { name: "Transport Fee (Annual)", defaultAmount: 8000 },
    { name: "Books & Stationery", defaultAmount: 3000 },
    { name: "Uniform Fee", defaultAmount: 2000 },
    { name: "Activity Fee", defaultAmount: 2000 },
    { name: "Confirmation Fee", defaultAmount: 15000 },
  ];

  for (const fi of feeItems) {
    const existing = await prisma.feeItem.findFirst({ where: { name: fi.name } });
    if (!existing) {
      await prisma.feeItem.create({ data: fi });
    }
  }

  // Default Admin User
  const adminRole = await prisma.role.findUnique({ where: { name: RoleName.SYSTEM_ADMIN } });
  const existingAdmin = await prisma.staffUser.findUnique({ where: { username: "admin" } });

  if (!existingAdmin && adminRole) {
    const hash = await bcrypt.hash("Admin@12345", 12);
    const admin = await prisma.staffUser.create({
      data: {
        username: "admin",
        email: "admin@school.edu.in",
        passwordHash: hash,
        fullName: "System Administrator",
        isActive: true,
        mustChangePassword: true,
      },
    });

    await prisma.staffUserRole.create({
      data: { staffUserId: admin.id, roleId: adminRole.id },
    });

    console.log("✅ Default admin created: username=admin password=Admin@12345");
    console.log("⚠️  CHANGE THE DEFAULT PASSWORD IMMEDIATELY AFTER FIRST LOGIN!");
  }

  // App Settings
  const settings = [
    { key: "age_cutoff_date", value: "07-31", label: "Age Calculation Cut-off Date (MM-DD)" },
    { key: "max_file_size_mb", value: "10", label: "Max Document Upload Size (MB)" },
    { key: "allow_waiver_without_approval", value: "false", label: "Allow Fee Waiver Without Approval" },
  ];

  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // Seeding Bus Routes and Bus Stops
  const routesData = [
    {
      routeNo: "R-01",
      name: "East Tambaram Route",
      stops: [
        { stopName: "Selaiyur", stage: "Stage A", pickupTime: "07:30 AM", dropTime: "04:30 PM" },
        { stopName: "Camp Road", stage: "Stage B", pickupTime: "07:45 AM", dropTime: "04:15 PM" },
        { stopName: "Tambaram Gate", stage: "Stage C", pickupTime: "08:00 AM", dropTime: "04:00 PM" },
      ],
    },
    {
      routeNo: "R-02",
      name: "Velachery Route",
      stops: [
        { stopName: "Velachery Jn", stage: "Stage A", pickupTime: "07:15 AM", dropTime: "04:45 PM" },
        { stopName: "Vijayanagar", stage: "Stage B", pickupTime: "07:30 AM", dropTime: "04:30 PM" },
        { stopName: "Medavakkam Jn", stage: "Stage C", pickupTime: "07:50 AM", dropTime: "04:10 PM" },
      ],
    },
    {
      routeNo: "R-03",
      name: "Chromepet Route",
      stops: [
        { stopName: "Chromepet Bus Stand", stage: "Stage A", pickupTime: "07:20 AM", dropTime: "04:40 PM" },
        { stopName: "Mit Bridge", stage: "Stage B", pickupTime: "07:35 AM", dropTime: "04:25 PM" },
        { stopName: "Pallavaram", stage: "Stage C", pickupTime: "07:50 AM", dropTime: "04:10 PM" },
      ],
    },
  ];

  for (const r of routesData) {
    let route = await prisma.busRoute.findFirst({
      where: { routeNo: r.routeNo },
    });
    if (!route) {
      route = await prisma.busRoute.create({
        data: {
          routeNo: r.routeNo,
          name: r.name,
          isActive: true,
        },
      });
    }

    for (const s of r.stops) {
      const existingStop = await prisma.busStop.findFirst({
        where: { routeId: route.id, stopName: s.stopName },
      });
      if (!existingStop) {
        await prisma.busStop.create({
          data: {
            routeId: route.id,
            stopName: s.stopName,
            stage: s.stage,
            pickupTime: s.pickupTime,
            dropTime: s.dropTime,
          },
        });
      }
    }
  }

  console.log("✅ Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
