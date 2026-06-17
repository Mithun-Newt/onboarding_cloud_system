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
      name: process.env.NEXT_PUBLIC_SCHOOL_NAME || "Appu Arivaalayem",
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
      name: "JSC",
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
    { name: "KG 1 (PRE-KG)", sortOrder: 1 },
    { name: "KG 2 (JKG)", sortOrder: 2 },
    { name: "KG 3 (SKG)", sortOrder: 3 },
    { name: "Grade 1 - YAAZH", sortOrder: 4 },
    { name: "Grade 1 (ACS)", sortOrder: 5 },
    { name: "Grade 2 (YAAZH & VEENAI)", sortOrder: 6 },
    { name: "Grade 2 (ACS)", sortOrder: 7 },
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
  await prisma.busStop.deleteMany({});
  await prisma.busRoute.deleteMany({});

  const routesData = [
    {
      routeNo: "Stage 1",
      name: "Stage 1 (<= 2.0 Km)",
      stops: [
        { stopName: "லட்சுமி நகர்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.74 Km" },
        { stopName: "ஸ்ரீமஹால்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.66 Km" },
        { stopName: "தோட்டக்காடு", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.91 Km" },
        { stopName: "மாடர்ன்வேபிரிட்ஜ்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.73 Km" },
        { stopName: "மடத்தூர்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.99 Km" },
        { stopName: "கொங்கணாபுரம் அரசுப்பள்ளி-1", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.93 Km" },
        { stopName: "கொங்கணாபுரம் அரசுப்பள்ளி-2", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.93 Km" },
        { stopName: "சிமெண்ட் கடை", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.79 Km" },
        { stopName: "பச்சாங்காடு பிரிவு", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.74 Km" },
        { stopName: "காட்டூர்-6", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "2.0 Km" },
        { stopName: "காட்டூர்-7", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.7 Km" },
        { stopName: "காட்டூர்-8", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.2 Km" },
        { stopName: "கொங்கணாபுரம்-மொரம்பக்காடு-1", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.8 Km" },
        { stopName: "கொங்கணாபுரம்-மொரம்பக்காடு-2", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.7 Km" },
        { stopName: "கொங்கணாபுரம்-மொரம்பக்காடு-3", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.6 Km" },
        { stopName: "கொங்கணாபுரம்-ஸ்டேட் பேங்க்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.2 Km" },
        { stopName: "கொங்கணாபுரம் பேக்கரி", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.0 Km" },
        { stopName: "மேட்டுக்காடு டேங்க்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.92 Km" },
        { stopName: "குண்டுரம்பாளையம்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.19 Km" },
        { stopName: "எண்ணெய் மண்டி-2", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.76 Km" },
        { stopName: "பைபாஸ்-1", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.85 Km" },
        { stopName: "பைபாஸ்-2", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.85 Km" },
        { stopName: "பைபாஸ்-3", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.85 Km" },
        { stopName: "பைபாஸ்-4", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.85 Km" },
        { stopName: "வைகுந்தம் ரோடு", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.59 Km" },
        { stopName: "கொங்கணாபுரம் பஸ் ஸ்டாப்-1", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.28 Km" },
        { stopName: "கொங்கணாபுரம் பஸ் ஸ்டாப்-2", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.28 Km" },
        { stopName: "சாந்தி சில்க் ஹவுஸ்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.07 Km" },
        { stopName: "ரெங்கபாளையம்-1", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.02 Km" },
        { stopName: "ரெங்கபாளையம்-2", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.02 Km" },
        { stopName: "ரெங்கபாளையம்-3", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.02 Km" },
        { stopName: "ரங்கம்பாளையம்-1", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.23 Km" },
        { stopName: "ரங்கம்பாளையம்-2", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.05 Km" },
        { stopName: "மோரி வளவு", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.23 Km" },
        { stopName: "பாலாஜி பர்னிச்சர்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.54 Km" },
        { stopName: "ரெட்டிப்பட்டி பார்க்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.77 Km" },
        { stopName: "ரெட்டிப்பட்டி", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.78 Km" },
        { stopName: "வைகுந்தம் பிரிவு ரோடு", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.69 Km" },
        { stopName: "பெரிய மாரியம்மன் கோவில் பிரிவு", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.45 Km" },
        { stopName: "கே.எஸ்.நகர்-1", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.71 Km" },
        { stopName: "கே.எஸ்.நகர்-2", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.65 Km" },
        { stopName: "கொங்கணாபுரம் காவல் நிலையம்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.65 Km" },
        { stopName: "பச்சாங்காடு பிரிவு", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.72 Km" },
        { stopName: "கொங்கணாபுரம் அரசு பள்ளி", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.98 Km" },
        { stopName: "கொங்கணாபுரம்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.31 Km" },
        { stopName: "மாரியம்மன் கோவில்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "1.45 Km" },
        { stopName: "குண்டரசம்பாளையம்", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "0.4 Km" },
        { stopName: "குண்டரசம்பாளையம் முள்ளிக்காடு", stage: "Stage 1", pickupTime: null, dropTime: null, distance: "0.4 Km" }
      ],
    },
    {
      routeNo: "Stage 2",
      name: "Stage 2 (2.1 - 4.0 Km)",
      stops: [
        { stopName: "ஸ்ரீஅம்மன் நகர் பருத்தி மில்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.4 Km" },
        { stopName: "மட்டம்பட்டி", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.58 Km" },
        { stopName: "வேல்முருகன் மில்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.55 Km" },
        { stopName: "எருமைப்பட்டி பிரிவு", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.55 Km" },
        { stopName: "முத்துசாமி மில்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.75 Km" },
        { stopName: "ஓடுவன்காட்டுவளவு", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.8 Km" },
        { stopName: "ஆனைக்காட்டூர் தென்னைமரம்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.72 Km" },
        { stopName: "கட்டியனூர்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.88 Km" },
        { stopName: "கோரக்குட்டப்பட்டி", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.32 Km" },
        { stopName: "அய்யம்பாளையம்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.66 Km" },
        { stopName: "தொண்டிபாளையம்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.95 Km" },
        { stopName: "மசக்குமாரபாளையம்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.75 Km" },
        { stopName: "ஆயில் மில்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.82 Km" },
        { stopName: "வெள்ளக்கல்பட்டி-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.85 Km" },
        { stopName: "வெள்ளக்கல்பட்டி-2", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.97 Km" },
        { stopName: "வெள்ளக்கல்பட்டி பால் சென்டர்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.81 Km" },
        { stopName: "மாரியம்மன் கோவில்-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.97 Km" },
        { stopName: "மாரியம்மன் கோவில்-2", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.97 Km" },
        { stopName: "வெட்டுக்காடு", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.5 Km" },
        { stopName: "ஆசாரி பட்டறை", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "4.0 Km" },
        { stopName: "அலகாபாத் வங்கி", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.74 Km" },
        { stopName: "சுண்ணாம்புபுதூர்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.64 Km" },
        { stopName: "நத்தக்காட்டூர்-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.41 Km" },
        { stopName: "நத்தக்காட்டூர்-2", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.99 Km" },
        { stopName: "காட்டுவளவு", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.14 Km" },
        { stopName: "செக்காங்காடு-3", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.52 Km" },
        { stopName: "செக்காங்காடு-2", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.63 Km" },
        { stopName: "செக்காங்காடு-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.82 Km" },
        { stopName: "எருமைப்பட்டி ஊராட்சி நிலையம்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.15 Km" },
        { stopName: "காவடிகாரனூர் கோவில்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.8 Km" },
        { stopName: "சேலத்தான்காடு-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.5 Km" },
        { stopName: "சேலத்தான்காடு-2", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.2 Km" },
        { stopName: "சேலத்தான்காடு-3", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.2 Km" },
        { stopName: "காட்டூர்-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.7 Km" },
        { stopName: "காட்டூர்-2", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.3 Km" },
        { stopName: "காட்டூர்-3", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.1 Km" },
        { stopName: "காட்டூர்-4", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.0 Km" },
        { stopName: "காட்டூர்-5", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.2 Km" },
        { stopName: "கொங்கணாபுரம்-குமரன்நகர்-2", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.2 Km" },
        { stopName: "கொங்கணாபுரம்-குமரன்நகர்-3", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.1 Km" },
        { stopName: "கல்கி கேஸ்குடோன்-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.24 Km" },
        { stopName: "கல்கி கேஸ்குடோன்-2", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.24 Km" },
        { stopName: "எட்டிமரத்தான் காடு", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.37 Km" },
        { stopName: "கொங்குப்பட்டி-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.61 Km" },
        { stopName: "குறிக்கியான் காடு", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.51 Km" },
        { stopName: "தூங்கானூர்-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.29 Km" },
        { stopName: "தூங்கானூர்-2", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.84 Km" },
        { stopName: "தூங்கானூர்-3", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.84 Km" },
        { stopName: "வெட்டுக்காடு ஈ.பி.ஆர்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.97 Km" },
        { stopName: "வெட்டுக்காடு பஸ்ஸ்டாப்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.56 Km" },
        { stopName: "கூலையங்காடு", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.04 Km" },
        { stopName: "ஆன்றபட்டியான்காடு-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.22 Km" },
        { stopName: "ஆன்றபட்டியான்காடு-2", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.22 Km" },
        { stopName: "பழனியாங்காடு", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.86 Km" },
        { stopName: "கடவளவு", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.64 Km" },
        { stopName: "கீழ்க்கூத்தாடிபாளையம்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.55 Km" },
        { stopName: "தூங்கானூர்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.91 Km" },
        { stopName: "புதுக்காடு", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.31 Km" },
        { stopName: "ஆணைக்காடு மாரியம்மன் கோவில்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.53 Km" },
        { stopName: "ஆணைக்காடு", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.86 Km" },
        { stopName: "ஐயம்பாளையம்", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.67 Km" },
        { stopName: "மூலப்பாதை-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.85 Km" },
        { stopName: "மூலப்பாதை-2", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "3.75 Km" },
        { stopName: "ஆசாரிப்பட்டறை-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.84 Km" },
        { stopName: "ஆசாரிப்பட்டறை-2", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.84 Km" },
        { stopName: "குமரன் நகர்-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.52 Km" },
        { stopName: "மொரம்புக்காடு-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "2.27 Km" },
        { stopName: "பாலிபெருமாள்கோவில்-1", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "4.0 Km" },
        { stopName: "பாலிபெருமாள்கோவில்-2", stage: "Stage 2", pickupTime: null, dropTime: null, distance: "4.0 Km" }
      ],
    },
    {
      routeNo: "Stage 3",
      name: "Stage 3 (4.1 - 6.0 Km)",
      stops: [
        { stopName: "பூவானூர் பங்க்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.6 Km" },
        { stopName: "ஜோசியர்காடு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.8 Km" },
        { stopName: "கன்னந்தேரி-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.6 Km" },
        { stopName: "கன்னந்தேரி-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.11 Km" },
        { stopName: "கன்னந்தேரி-3", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.44 Km" },
        { stopName: "கன்னந்தேரி-4", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.36 Km" },
        { stopName: "கன்னந்தேரி-5", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.22 Km" },
        { stopName: "பாலிக்காடு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.5 Km" },
        { stopName: "நாயக்கன் வளவு பிரிவு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.3 Km" },
        { stopName: "கூத்தாடிபாளையம் (மேலே-1)", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.15 Km" },
        { stopName: "கூத்தாடிபாளையம்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.3 Km" },
        { stopName: "கூத்தாடிபாளையம் (பஸ் ஸ்டாப்)", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.3 Km" },
        { stopName: "பாலப்பட்டி பிரிவு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.2 Km" },
        { stopName: "எருமைப்பட்டி பிரிவு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.18 Km" },
        { stopName: "கீழ்கூத்தாடிபாளையம்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.1 Km" },
        { stopName: "பூசாரி காட்டுவளவு-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.21 Km" },
        { stopName: "பூசாரி காட்டுவளவு-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.37 Km" },
        { stopName: "பூசாரி காட்டுவளவு-3", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.61 Km" },
        { stopName: "தெற்கு வளவு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.13 Km" },
        { stopName: "மேட்டுக்காடு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.27 Km" },
        { stopName: "அப்புசாமி மில்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.21 Km" },
        { stopName: "பூங்கா நகர்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.35 Km" },
        { stopName: "வீரப்பம்பாளையம் ரிங்ரோடு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.42 Km" },
        { stopName: "SRS பால்பண்ணை", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.76 Km" },
        { stopName: "வெல்லுத்து பெருமாள் கோவில்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.88 Km" },
        { stopName: "வீரப்பம்பாளையம்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.45 Km" },
        { stopName: "வீரப்பம்பாளையம்1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.45 Km" },
        { stopName: "புதூர்-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.35 Km" },
        { stopName: "புதூர்-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.35 Km" },
        { stopName: "பறையங்காடு வளவு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.85 Km" },
        { stopName: "எருமைப்பட்டி-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.28 Km" },
        { stopName: "எருமைப்பட்டி-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.92 Km" },
        { stopName: "எருமைப்பட்டி-3", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.87 Km" },
        { stopName: "கூத்தாடிபாளையம்-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.24 Km" },
        { stopName: "ஆலமரம்-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.28 Km" },
        { stopName: "ஆலமரம்-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.28 Km" },
        { stopName: "தங்காயூர்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.8 Km" },
        { stopName: "நோட்டக்காரன்குட்டை", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.3 Km" },
        { stopName: "தேவணூர்பிரிவு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.75 Km" },
        { stopName: "கருக்கன் காட்டுவளவு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.33 Km" },
        { stopName: "மூலப்பாதை-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.18 Km" },
        { stopName: "மூலப்பாதை-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.6 Km" },
        { stopName: "பூவானூர்-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.64 Km" },
        { stopName: "பூவானூர்-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.64 Km" },
        { stopName: "ஜோசியர்காடு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.21 Km" },
        { stopName: "கன்னந்தேரி-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.17 Km" },
        { stopName: "கன்னந்தேரி-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.17 Km" },
        { stopName: "கன்னந்தேரி-3", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.17 Km" },
        { stopName: "கச்சுப்பள்ளி-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.04 Km" },
        { stopName: "கச்சுப்பள்ளி-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.31 Km" },
        { stopName: "கச்சுப்பள்ளி-3", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.31 Km" },
        { stopName: "கச்சுப்பள்ளி பூங்கா", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.31 Km" },
        { stopName: "எருமைப்பட்டி தபால்நிலையம்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.08 Km" },
        { stopName: "எருமைப்பட்டி அம்மன்கோவில்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.12 Km" },
        { stopName: "எருமைப்பட்டி-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.14 Km" },
        { stopName: "எருமைப்பட்டி-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.63 Km" },
        { stopName: "பாலப்பட்டி-3", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.27 Km" },
        { stopName: "பாலப்பட்டி-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.45 Km" },
        { stopName: "பாலப்பட்டி-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.77 Km" },
        { stopName: "பலகாரவளவு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.98 Km" },
        { stopName: "வெள்ளையம்பாளையம்-3", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.71 Km" },
        { stopName: "வெள்ளையம்பாளையம்-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.71 Km" },
        { stopName: "வெள்ளையம்பாளையம்-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.98 Km" },
        { stopName: "மோட்டூர்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.39 Km" },
        { stopName: "நாச்சனூர்-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.08 Km" },
        { stopName: "நாச்சனூர்-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.12 Km" },
        { stopName: "கோரண்டம்பட்டி-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.68 Km" },
        { stopName: "கோரண்டம்பட்டி-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.81 Km" },
        { stopName: "நாச்சனூர் காட்டுவளவு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.76 Km" },
        { stopName: "சாமுண்டிவளவு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.88 Km" },
        { stopName: "பெரிய நாச்சியூர்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "5.46 Km" },
        { stopName: "காவடிகாரனூர் நலந்தக்குட்டை-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.6 Km" },
        { stopName: "காவடிகாரனூர் நலந்தக்குட்டை-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.6 Km" },
        { stopName: "காவடிகாரனூர் வளவு", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.2 Km" },
        { stopName: "காவடிகாரனூர்-1", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.6 Km" },
        { stopName: "காவடிகாரனூர்-2", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.6 Km" },
        { stopName: "காவடிகாரனூர்-3", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.4 Km" },
        { stopName: "கச்சுப்பள்ளி", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.97 Km" },
        { stopName: "பவர் ஆபீஸ்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.36 Km" },
        { stopName: "குரும்பப்பட்டி மாரியம்மன் கோவில்", stage: "Stage 3", pickupTime: null, dropTime: null, distance: "4.1 Km" }
      ],
    },
    {
      routeNo: "Stage 4",
      name: "Stage 4 (6.1 - 8.0 Km)",
      stops: [
        { stopName: "குண்டேரிமேடு-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.9 Km" },
        { stopName: "குண்டேரிமேடு-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.7 Km" },
        { stopName: "குண்டேரிமேடு-3", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.7 Km" },
        { stopName: "குண்டேரிமேடு-4", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.6 Km" },
        { stopName: "ஒண்டிபுனை-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.5 Km" },
        { stopName: "ஒண்டிபுனை-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.5 Km" },
        { stopName: "ஒண்டிபுனை-4", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.4 Km" },
        { stopName: "ஒண்டிக்கடை-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.15 Km" },
        { stopName: "குண்டல் பட்டி", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.6 Km" },
        { stopName: "பாபி கடை-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.23 Km" },
        { stopName: "பாபி கடை-3", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.23 Km" },
        { stopName: "காட்டூர்-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.63 Km" },
        { stopName: "கரையனூர்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "9.21 Km" },
        { stopName: "மாங்குட்டப்பட்டி-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.59 Km" },
        { stopName: "மாங்குட்டப்பட்டி-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.41 Km" },
        { stopName: "மாங்குட்டப்பட்டி-3", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.39 Km" },
        { stopName: "மாங்குட்டப்பட்டி-4", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.39 Km" },
        { stopName: "மாங்குட்டப்பட்டி-5", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.39 Km" },
        { stopName: "கொண்டைக்கார வளவு-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.64 Km" },
        { stopName: "கொண்டைக்கார வளவு-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.77 Km" },
        { stopName: "பனங்காட்டூர்-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.25 Km" },
        { stopName: "பனங்காட்டூர்-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.25 Km" },
        { stopName: "வரதங்காட்டானூர்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.77 Km" },
        { stopName: "குட்டிபையன் வளவு-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.83 Km" },
        { stopName: "குட்டிபையன் வளவு-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.83 Km" },
        { stopName: "முனியப்பன்கோவில்(கோரணம்பட்டி)", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.24 Km" },
        { stopName: "ஏரிக்காடு", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.12 Km" },
        { stopName: "ராயணம்பட்டி பிரிவு", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.48 Km" },
        { stopName: "கோம்பைக்காடு", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.15 Km" },
        { stopName: "ஆண்டிபாளையம்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.77 Km" },
        { stopName: "செட்டியூர்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.25 Km" },
        { stopName: "ஒண்டிப்பனை", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.11 Km" },
        { stopName: "தண்ணீர் பைப்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.15 Km" },
        { stopName: "அ.புதூர்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.86 Km" },
        { stopName: "கரட்டூர் மாரியம்மன்கோவில்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.61 Km" },
        { stopName: "கரட்டூர்-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.97 Km" },
        { stopName: "பெருமாள் கோவில்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.28 Km" },
        { stopName: "காட்டூர்-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.11 Km" },
        { stopName: "காட்டூர்-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.97 Km" },
        { stopName: "காட்டூர்-3", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.97 Km" },
        { stopName: "காட்டூர்-4", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.62 Km" },
        { stopName: "காட்டூர்-5", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.62 Km" },
        { stopName: "ஒண்டிக்கடை-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.37 Km" },
        { stopName: "ஒண்டிக்கடை-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.37 Km" },
        { stopName: "கோசேரிப்பட்டி-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.86 Km" },
        { stopName: "கோசேரிப்பட்டி-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.86 Km" },
        { stopName: "கோசேரிப்பட்டி-3", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.86 Km" },
        { stopName: "கருப்பாய்காடு", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.54 Km" },
        { stopName: "பள்ளிப்பட்டி", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.85 Km" },
        { stopName: "பள்ளிப்பட்டி-பிரிவு", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.38 Km" },
        { stopName: "கல்லங்காடு", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.82 Km" },
        { stopName: "கோவலங்காடு பிள்ளையார் கோவில்-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.8 Km" },
        { stopName: "தெற்குகாடு-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.91 Km" },
        { stopName: "தெற்குகாடு", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.91 Km" },
        { stopName: "தெற்குகாடு-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.91 Km" },
        { stopName: "கோவலங்காடு கொடிகம்பம்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.11 Km" },
        { stopName: "மூலக்கடை-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.37 Km" },
        { stopName: "மூலக்கடை-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.45 Km" },
        { stopName: "கரட்டுக்காடு-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.71 Km" },
        { stopName: "கரட்டுக்காடு-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.71 Km" },
        { stopName: "செல்லியம்மன்கோவில் மோரி-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.76 Km" },
        { stopName: "செல்லியம்மன்கோவில் மோரி-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.76 Km" },
        { stopName: "ஆசாரிகாடு-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.02 Km" },
        { stopName: "ஆசாரிகாடு-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.02 Km" },
        { stopName: "பனங்காடு", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.04 Km" },
        { stopName: "பட்டரை காட்டு வளவு", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.57 Km" },
        { stopName: "பக்கரிக்காட்டு வளவு", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.66 Km" },
        { stopName: "பள்ளிப்பட்டி பிரிவு", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.13 Km" },
        { stopName: "ஸ்டேட் பேங்க்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.72 Km" },
        { stopName: "போளீஸ் குவார்ட்டர்ஸ்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.76 Km" },
        { stopName: "மாட்டு ஹாஸ்பிட்டல்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.61 Km" },
        { stopName: "வைத்தியலிங்கம் திருமணமண்டபம்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.43 Km" },
        { stopName: "பத்திரஆபீஸ்-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.27 Km" },
        { stopName: "பதிரஆபீஸ்-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.27 Km" },
        { stopName: "போலீஸ் ஸ்டேஷன்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.15 Km" },
        { stopName: "கும்பகோணம் பாத்திரக்கடை-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.89 Km" },
        { stopName: "கும்பகோணம் பாத்திரக்கடை-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.89 Km" },
        { stopName: "மோகன் ஹாஸ்பிட்டல்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.81 Km" },
        { stopName: "Y.V.B சில்க்ஸ்-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.72 Km" },
        { stopName: "Y.V.B சில்க்ஸ்-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.72 Km" },
        { stopName: "S.K.பல் மருத்துவமனை", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.67 Km" },
        { stopName: "மேட்டுத்தெரு", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.55 Km" },
        { stopName: "கோகிலா மெடிக்கல்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.46 Km" },
        { stopName: "கோகுலகிருஷ்ணன் மருத்துவமனை", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.36 Km" },
        { stopName: "அங்காளம்மன் கோவில் தெரு-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.25 Km" },
        { stopName: "அங்காளம்மன் கோவில் தெரு-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.25 Km" },
        { stopName: "திரெளபதி அம்மன்கோவில்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.14 Km" },
        { stopName: "யூனியன் ஆபீஸ்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.33 Km" },
        { stopName: "பாவா மெடிக்கல்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.79 Km" },
        { stopName: "மோட்டூர்-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.11 Km" },
        { stopName: "மோட்டூர்-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.11 Km" },
        { stopName: "வாழக்குட்டைப்பட்டி", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.18 Km" },
        { stopName: "வாழக்குட்டைப்பட்டி-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.18 Km" },
        { stopName: "சின்னமணிவளவு பால் சொசைட்டி", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.04 Km" },
        { stopName: "தளவாய்ப்பட்டி", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.11 Km" },
        { stopName: "தங்காயூர் மாரியம்மன்கோவில்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.33 Km" },
        { stopName: "பறையங்காட்டானூர்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.88 Km" },
        { stopName: "தங்காயூர் மேல்கடை", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.76 Km" },
        { stopName: "தங்காயூர் கீழ்கடை", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.76 Km" },
        { stopName: "மாமரத்தானூர்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.17 Km" },
        { stopName: "ஊஞ்சான்காடு-1", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.4 Km" },
        { stopName: "ஊஞ்சான்காடு-2", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "6.4 Km" },
        { stopName: "எடப்பாடி-குமரன் தியேட்டர்", stage: "Stage 4", pickupTime: null, dropTime: null, distance: "7.58 Km" }
      ],
    },
    {
      routeNo: "Stage 5",
      name: "Stage 5 (8.1 - 10.0 Km)",
      stops: [
        { stopName: "அழகனூர்-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.5 Km" },
        { stopName: "அழகனூர்-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.5 Km" },
        { stopName: "அழகனூர்-3", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.4 Km" },
        { stopName: "அழகனூர்-4", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.4 Km" },
        { stopName: "ஆசாரிப்பட்டறை-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.2 Km" },
        { stopName: "அண்ணாநகர்-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.9 Km" },
        { stopName: "அண்ணாநகர்-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.9 Km" },
        { stopName: "செல்லியம்மன் கோவில் மோரி", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.71 Km" },
        { stopName: "தோலுக்காரன் காடு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "10 Km" },
        { stopName: "சரவணா ஹோட்டல் பின்புறம்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "10.2 Km" },
        { stopName: "வைகுந்தம்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "10 Km" },
        { stopName: "வண்ணாங்குட்டை பிரிவு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9 Km" },
        { stopName: "குண்டல்பட்டி விநாயகர் கோவில்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "10 Km" },
        { stopName: "ஏரிமூலை", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.85 Km" },
        { stopName: "கொம்பாடி காடு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.5 Km" },
        { stopName: "கோணம்பை", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.58 Km" },
        { stopName: "நெசவாளர் காலனி", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.84 Km" },
        { stopName: "பெயிண்டிங் பட்டறை", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.46 Km" },
        { stopName: "வெள்ளரி வெள்ளரி ரிங் ரோடு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.54 Km" },
        { stopName: "வெள்ளரி வெள்ளரி பிரிவு-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.34 Km" },
        { stopName: "வெள்ளரி வெள்ளரி பிரிவு-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.34 Km" },
        { stopName: "ஹவுசிங் போர்டு-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.24 Km" },
        { stopName: "ஹவுசிங் போர்டு-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.24 Km" },
        { stopName: "விஸ்டம் பள்ளி", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.2 Km" },
        { stopName: "காளியம்மன் கோவில்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.1 Km" },
        { stopName: "ஐயன்காட்டூர்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.8 Km" },
        { stopName: "மாரியம்மன் கோவில்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.8 Km" },
        { stopName: "ராஜாமணித்தோட்டம்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.98 Km" },
        { stopName: "ஒருக்காமலை", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.39 Km" },
        { stopName: "புதுப்பாளையம்-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.97 Km" },
        { stopName: "புதுப்பாளையம்-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.97 Km" },
        { stopName: "புதுப்பாளையம்-3", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.97 Km" },
        { stopName: "புதுப்பாளையம் வாய்க்கால் பாளையம்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.71 Km" },
        { stopName: "புதுப்பாளையம் பெருமாள்கோவில்-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.46 Km" },
        { stopName: "புதுப்பாளையம் பெருமாள்கோவில்-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.46 Km" },
        { stopName: "ஈஸ்வரன் கோவில்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.75 Km" },
        { stopName: "ராயணம்பட்டி கரட்டுக்காடு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.56 Km" },
        { stopName: "ராயணம்பட்டி", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.77 Km" },
        { stopName: "சடையம்பாளையம்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "10 Km" },
        { stopName: "ராயணம்பட்டி பிரிவு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.56 Km" },
        { stopName: "ராயணம்பட்டி பெரியமாரியம்மன் கோவில்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9 Km" },
        { stopName: "பாச்சாலியூர் காட்டுவளவு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.5 Km" },
        { stopName: "பாச்சாலியூர்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.5 Km" },
        { stopName: "தொப்பக்காடு-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.12 Km" },
        { stopName: "தொப்பக்காடு-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.12 Km" },
        { stopName: "பச்சியம்மன்கோவில்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.25 Km" },
        { stopName: "காட்டுவளவு-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.75 Km" },
        { stopName: "காட்டுவளவு-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.75 Km" },
        { stopName: "புதுக்குடியனூர்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.51 Km" },
        { stopName: "சிவன் காடு-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.49 Km" },
        { stopName: "சிவன் காடு-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.49 Km" },
        { stopName: "தோப்புக்காடு-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.92 Km" },
        { stopName: "தோப்புக்காடு-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.92 Km" },
        { stopName: "எட்டிக்கூட்டைமேடு-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.11 Km" },
        { stopName: "எட்டிக்கூட்டைமேடு-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.11 Km" },
        { stopName: "கோம்மைக்காடு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.08 Km" },
        { stopName: "ஆலச்சம்பாளையம் ரிங்ரோடு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.98 Km" },
        { stopName: "ஆலச்சம்பாளையம்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.55 Km" },
        { stopName: "ஆலச்சம்பாளையம் பாறைக்காட்டு மேடு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.39 Km" },
        { stopName: "ஏ.டி.சி.டிப்போ", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.55 Km" },
        { stopName: "மேட்டுத்தெரு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.21 Km" },
        { stopName: "குஞ்சப்பனூர்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.89 Km" },
        { stopName: "அழகப்பம்பாளையம் ஆயில் மில்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.35 Km" },
        { stopName: "அழகப்பம்பாளையம்-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.17 Km" },
        { stopName: "அழகப்பம்பாளையம்-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.17 Km" },
        { stopName: "அழகப்பம்பாளையம்-3", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.79 Km" },
        { stopName: "அழகப்பம்பாளையம்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.83 Km" },
        { stopName: "போஸ்ட் ஆபீஸ்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.5 Km" },
        { stopName: "நாதன்காடு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.01 Km" },
        { stopName: "காளிப்பட்டி பிரிவு-3", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.59 Km" },
        { stopName: "காளிப்பட்டி பிரிவு-2`", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.59 Km" },
        { stopName: "காளிப்பட்டி பிரிவு-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.59 Km" },
        { stopName: "செல்லப்பம்பட்டி", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.95 Km" },
        { stopName: "வேலாக்கோவில்-4", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.26 Km" },
        { stopName: "வேலாக்கோவில்-3", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.23 Km" },
        { stopName: "வேலாக்கோவில்-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.21 Km" },
        { stopName: "வேலாக்கோவில்-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.13 Km" },
        { stopName: "ஏரிக்காடு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.27 Km" },
        { stopName: "மெய்யம்பாளையம்-5", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.26 Km" },
        { stopName: "மெய்யம்பாளையம்-4", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.48 Km" },
        { stopName: "மெய்யம்பாளையம்-3", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.58 Km" },
        { stopName: "மெய்யம்பாளையம்-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.88 Km" },
        { stopName: "மெய்யம்பாளையம்-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.15 Km" },
        { stopName: "வாழைக்குட்டை", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.15 Km" },
        { stopName: "குப்பதாசன் வளவு-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.02 Km" },
        { stopName: "வாளன் வளவு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.31 Km" },
        { stopName: "வேலமாவலசு-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "10 Km" },
        { stopName: "அண்ணாமலைக்காடு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.7 Km" },
        { stopName: "பிள்ளையார் கோவில்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.5 Km" },
        { stopName: "கோழிப்பண்ணை", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8 Km" },
        { stopName: "பாசபாலிக்காடு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.2 Km" },
        { stopName: "பாசபாலிக்காடு முருகன் கோவில்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9 Km" },
        { stopName: "பாலதலையான்காடு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.4 Km" },
        { stopName: "கோணமோரி", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.91 Km" },
        { stopName: "எலவம்பாளையம் ஊர்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.1 Km" },
        { stopName: "பள்ளிப்பட்டி-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.3 Km" },
        { stopName: "பள்ளிப்பட்டி-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.46 Km" },
        { stopName: "பள்ளிப்பட்டி", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.46 Km" },
        { stopName: "ஆவணியூர்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.24 Km" },
        { stopName: "கிரேஸி சில்க்ஸ்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.64 Km" },
        { stopName: "P.R.M.பங்க்", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.37 Km" },
        { stopName: "மூக்கரை பெருமாள் கோவில்-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.06 Km" },
        { stopName: "மூக்கரை பெருமாள் கோவில்-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.02 Km" },
        { stopName: "காளிகவுண்டன்வளவு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "9.39 Km" },
        { stopName: "மோட்டூர் பிரிவு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.51 Km" },
        { stopName: "எடப்பாடி-ஹவுசிங் போர்டு-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.26 Km" },
        { stopName: "எடப்பாடி-ஹவுசிங் போர்டு-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.34 Km" },
        { stopName: "எடப்பாடி-ஹவுசிங் போர்டு-3", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.34 Km" },
        { stopName: "எடப்பாடி-ஹவுசிங் போர்டு-4", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.48 Km" },
        { stopName: "எடப்பாடி-ஹவுசிங் போர்டு-5", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.56 Km" },
        { stopName: "எடப்பாடி-ஹவுசிங் போர்டு-6", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.56 Km" },
        { stopName: "எடப்பாடி-ஹவுசிங் போர்டு-7", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.67 Km" },
        { stopName: "பனஞ்சாரி", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "5 Km" },
        { stopName: "காட்டூர் ரோடு-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "5 Km" },
        { stopName: "காட்டூர் ரோடு-2", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "5 Km" },
        { stopName: "காட்டூர் ரோடு-3", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "5 Km" },
        { stopName: "காட்டூர் ரோடு-4", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "5 Km" },
        { stopName: "காட்டூர் ரோடு-5", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "5 Km" },
        { stopName: "ஏரி ரோடு", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.58 Km" },
        { stopName: "ஏரி ரோடு-1", stage: "Stage 5", pickupTime: null, dropTime: null, distance: "8.58 Km" }
      ],
    },
    {
      routeNo: "Stage 6",
      name: "Stage 6 (10.1 - 12.0 Km)",
      stops: [
        { stopName: "மகுடஞ்சாவடி-1", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10.7 Km" },
        { stopName: "மகுடஞ்சாவடி-2", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10.4 Km" },
        { stopName: "மகுடஞ்சாவடி-3", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10 Km" },
        { stopName: "மணியங்காரன் காடு", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11 Km" },
        { stopName: "கணக்கச்சிப்பாளையம்", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11 Km" },
        { stopName: "ஊஞ்சக்காடு-1", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.05 Km" },
        { stopName: "ஊஞ்சக்காடு-2", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.05 Km" },
        { stopName: "ஊஞ்சக்காடு-3", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.05 Km" },
        { stopName: "ஊஞ்சக்காடு-4", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.05 Km" },
        { stopName: "ஊஞ்சக்காடு-5", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.05 Km" },
        { stopName: "சுண்டாக்கல்-1", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.81 Km" },
        { stopName: "சுண்டாக்கல்-2", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.81 Km" },
        { stopName: "கரடு-1", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.81 Km" },
        { stopName: "கரடு-2", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.81 Km" },
        { stopName: "கரடு-3", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.81 Km" },
        { stopName: "மாரியம்மன்கோவில்", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.9 Km" },
        { stopName: "சங்ககிரி ஆர்.கே.நகர்", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.8 Km" },
        { stopName: "மாவிலிப்பாளையம்", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.2 Km" },
        { stopName: "கொங்கணாபுரம் பிரிவு ரோடு", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10.5 Km" },
        { stopName: "சமுத்திரம்-1", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.14 Km" },
        { stopName: "சமுத்திரம்-2", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.14 Km" },
        { stopName: "சமுத்திரம்-3", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.11 Km" },
        { stopName: "சமுத்திரம்-4", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.07 Km" },
        { stopName: "சமுத்திரம்-5", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.07 Km" },
        { stopName: "முத்தையம்பட்டி அரசுபள்ளி", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.39 Km" },
        { stopName: "முத்தையம்பட்டி", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.84 Km" },
        { stopName: "காட்டூர்", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.04 Km" },
        { stopName: "கரும்பாலை", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.01 Km" },
        { stopName: "புதுப்பாளையம் சந்தை", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10.08 Km" },
        { stopName: "புதுப்பாளையம் மெடிக்கல்", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10.03 Km" },
        { stopName: "கன்னியாம்பட்டி காட்டுவளவு", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.2 Km" },
        { stopName: "கன்னியாம்பட்டி", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.2 Km" },
        { stopName: "காளியம்மன் கோவில்", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.2 Km" },
        { stopName: "மூலக்கடை-1", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10.7 Km" },
        { stopName: "மூலக்கடை-2", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10.7 Km" },
        { stopName: "பணங்காடு", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10.2 Km" },
        { stopName: "செக்குமேடு", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10.02 Km" },
        { stopName: "அக்கரைப்பட்டி-1", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.02 Km" },
        { stopName: "அக்கரைப்பட்டி-2", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.02 Km" },
        { stopName: "அக்கரைப்பட்டி-3", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.02 Km" },
        { stopName: "மூலப்பாதை (கல்வடங்கம்)", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.07 Km" },
        { stopName: "அருவங்காட்டூர்-1", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.08 Km" },
        { stopName: "அருவங்காட்டூர்-2", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.08 Km" },
        { stopName: "புதூர் மூலக்கடை", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.03 Km" },
        { stopName: "புதூர்", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.01 Km" },
        { stopName: "நாடார் காலனி-1", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11.1 Km" },
        { stopName: "நாடார் காலனி-2", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "11 Km" },
        { stopName: "வேலமாவலசு-1", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10.3 Km" },
        { stopName: "பாண்டியம்மேடு", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10.1 Km" },
        { stopName: "ஆலங்கொட்டாய்-1", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "12 Km" },
        { stopName: "ஆலங்கொட்டாய்-2", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "12 Km" },
        { stopName: "எட்டிக்கூட்டைமேடு-1", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10 Km" },
        { stopName: "எட்டிக்கூட்டைமேடு-2", stage: "Stage 6", pickupTime: null, dropTime: null, distance: "10 Km" }
      ],
    },
    {
      routeNo: "Stage 7",
      name: "Stage 7 (12.1 - 14.0 Km)",
      stops: [
        { stopName: "கெளதம் மெடிக்கல்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.5 Km" },
        { stopName: "சந்தைப்பேட்டை", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.8 Km" },
        { stopName: "ஃபயர் சர்வீஸ்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.4 Km" },
        { stopName: "கிருஷ்ணா நகர்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.7 Km" },
        { stopName: "பூசாரிவளவு", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.92 Km" },
        { stopName: "பனிக்கனூர் மூலக்கடை", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.12 Km" },
        { stopName: "பனிக்கனூர்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.66 Km" },
        { stopName: "மன்மதன் வளவு", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.08 Km" },
        { stopName: "கசப்பேரி", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.11 Km" },
        { stopName: "பனஞ்சாரி", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.08 Km" },
        { stopName: "ஓடக்காடு", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.02 Km" },
        { stopName: "கனரா வங்கி", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.04 Km" },
        { stopName: "சின்னப்பம்பட்டி", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.02 Km" },
        { stopName: "மேட்டுப்பாளையம்-1", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.9 Km" },
        { stopName: "மேட்டுப்பாளையம்-2", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.8 Km" },
        { stopName: "மேட்டுப்பாளையம்-3", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.2 Km" },
        { stopName: "மேட்டுப்பாளையம்-4", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.1 Km" },
        { stopName: "குள்ளம்பட்டி", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.09 Km" },
        { stopName: "பாரதிநகர்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.05 Km" },
        { stopName: "செங்கானூர்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.8 Km" },
        { stopName: "சக்தி வேபிரிட்ஜ்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.03 Km" },
        { stopName: "அத்தனூர்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.08 Km" },
        { stopName: "மேட்டுக்காடு-1", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.03 Km" },
        { stopName: "மேட்டுக்காடு-2", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.03 Km" },
        { stopName: "மேட்டுக்காடு-3", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.03 Km" },
        { stopName: "மேட்டுக்காடு-4", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.01 Km" },
        { stopName: "மேட்டுக்காடு-5", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.01 Km" },
        { stopName: "மேட்டுக்காடு-6", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.01 Km" },
        { stopName: "காச்சக்காரனூர்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.06 Km" },
        { stopName: "கூத்தம்பாளையம்-1", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.04 Km" },
        { stopName: "கூத்தம்பாளையம்-2", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.04 Km" },
        { stopName: "பொன்னியங்கோவில்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.02 Km" },
        { stopName: "பறையங்காட்டானூர்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13 Km" },
        { stopName: "வளையசெட்டிப்பட்டி பஸ் ஸ்டாப்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.6 Km" },
        { stopName: "கலியகவுண்டனூர்-1", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.98 Km" },
        { stopName: "கலியகவுண்டனூர்-2", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.98 Km" },
        { stopName: "கலியகவுண்டனூர்-3", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.8 Km" },
        { stopName: "கலியகவுண்டனூர்-4", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.5 Km" },
        { stopName: "கலியகவுண்டனூர்-5", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13.5 Km" },
        { stopName: "மோட்டூர்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "13 Km" },
        { stopName: "மோட்டூர் பிரிவு", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.8 Km" },
        { stopName: "ஏகாபுரம்", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.6 Km" },
        { stopName: "ஏகாபுரம்-1", stage: "Stage 7", pickupTime: null, dropTime: null, distance: "12.6 Km" }
      ],
    },
    {
      routeNo: "Stage 8",
      name: "Stage 8 (14.1 - 16.0 Km)",
      stops: [
        { stopName: "தாசங்காடு", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "14.8 Km" },
        { stopName: "ஆசிரியர் காலனி", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "14.08 Km" },
        { stopName: "முனியம்பட்டி ரைஸ்மில்", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "14.74 Km" },
        { stopName: "தாடிக்காரன்பட்டி", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "14.08 Km" },
        { stopName: "மடத்தூர்", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "14.02 Km" },
        { stopName: "செட்டிப்பட்டி சந்தை", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "15.01 Km" },
        { stopName: "பொன்னம்பாளையம்", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "15.8 Km" },
        { stopName: "காவனூர்", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "15.8 Km" },
        { stopName: "பூமணியூர்", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "15.4 Km" },
        { stopName: "பூச்சிமரத்துக்காடு", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "15.8 Km" },
        { stopName: "பூமணியூர் ஸ்கூல்", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "15.08 Km" },
        { stopName: "ஒக்கிலிப்பட்டி", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "15.06 Km" },
        { stopName: "எட்டிக்கூட்டைமேடு (கல்வடங்கம்)", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "15.04 Km" },
        { stopName: "தண்ணீர்தாசனூர்", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "15.01 Km" },
        { stopName: "அய்யனூர்", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "15.08 Km" },
        { stopName: "தாடிக்காரனூர்-1", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "14.09 Km" },
        { stopName: "தாடிக்காரனூர்-2", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "14.08 Km" },
        { stopName: "தப்பக்குட்டை பிரிவு", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "15.09 Km" },
        { stopName: "குப்பதாசன்வளவு", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "15 Km" },
        { stopName: "கூலக்கண்ணண் காடு", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "14.8 Km" },
        { stopName: "வளையசெட்டிப்பட்டி பிரிவு", stage: "Stage 8", pickupTime: null, dropTime: null, distance: "15 Km" }
      ],
    },
    {
      routeNo: "Stage 9",
      name: "Stage 9 (> 16.0 Km)",
      stops: [
        { stopName: "மயிலம்பட்டி", stage: "Stage 9", pickupTime: null, dropTime: null, distance: "20.02 Km" },
        { stopName: "கொட்டாயூர்", stage: "Stage 9", pickupTime: null, dropTime: null, distance: "17.08 Km" },
        { stopName: "கல்வடங்கம்", stage: "Stage 9", pickupTime: null, dropTime: null, distance: "18.04 Km" },
        { stopName: "புளியம்பட்டி", stage: "Stage 9", pickupTime: null, dropTime: null, distance: "20.2 Km" },
        { stopName: "இளம்பிள்ளை", stage: "Stage 9", pickupTime: null, dropTime: null, distance: "19.9 Km" },
        { stopName: "ராமாபுரம்", stage: "Stage 9", pickupTime: null, dropTime: null, distance: "19.5 Km" },
        { stopName: "பெருமாகவுண்டம்பட்டி", stage: "Stage 9", pickupTime: null, dropTime: null, distance: "18.6 Km" },
        { stopName: "வேம்படிதாளம்", stage: "Stage 9", pickupTime: null, dropTime: null, distance: "17.8 Km" },
        { stopName: "தேலூர்", stage: "Stage 9", pickupTime: null, dropTime: null, distance: "19.08 Km" },
        { stopName: "ஜலகண்டாபுரம்", stage: "Stage 9", pickupTime: null, dropTime: null, distance: "20.4 Km" }
      ],
    }
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
            distance: s.distance,
          },
        });
      }
    }
  }

  // Cohort Strengths seeding
  const cohortStrengths = [
    { className: "KG 1 (PRE-KG)", promotedStrength: 0, tc: 0, newAdmission: 47, target: 60, sortOrder: 1, academicYearId: academicYear.id },
    { className: "KG 2 (JKG)", promotedStrength: 34, tc: 1, newAdmission: 36, target: 70, sortOrder: 2, academicYearId: academicYear.id },
    { className: "KG 3 (SKG)", promotedStrength: 50, tc: 6, newAdmission: 10, target: 70, sortOrder: 3, academicYearId: academicYear.id },
    { className: "Grade 1 - YAAZH", promotedStrength: 45, tc: 0, newAdmission: 2, target: 35, sortOrder: 4, academicYearId: academicYear.id },
    { className: "Grade 1 (ACS)", promotedStrength: 29, tc: 0, newAdmission: 1, target: 30, sortOrder: 5, academicYearId: academicYear.id },
    { className: "Grade 2 (YAAZH & VEENAI)", promotedStrength: 49, tc: 0, newAdmission: 11, target: 70, sortOrder: 6, academicYearId: academicYear.id },
    { className: "Grade 2 (ACS)", promotedStrength: 28, tc: 1, newAdmission: 0, target: 30, sortOrder: 7, academicYearId: academicYear.id },
  ];

  for (const c of cohortStrengths) {
    await prisma.cohortStrength.upsert({
      where: {
        className_academicYearId: {
          className: c.className,
          academicYearId: c.academicYearId,
        },
      },
      update: {},
      create: c,
    });
  }

  console.log("✅ Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
