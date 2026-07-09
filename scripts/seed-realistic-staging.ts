import { PrismaClient, Gender, RegistrationStatus, AdmissionStatus, DocumentStatus, PaymentMode, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

const INDIAN_BOY_NAMES = [
  "Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Mithun", "Krishna", "Karthik", "Rohan", "Pranav",
  "Dev", "Kabir", "Ishaan", "Rudra", "Reyansh", "Ansh", "Atharv", "Yash", "Raghav", "Hari"
];

const INDIAN_GIRL_NAMES = [
  "Aanya", "Diya", "Saanvi", "Ananya", "Ishita", "Meera", "Zara", "Kavya", "Aditi", "Riya",
  "Sia", "Prisha", "Tara", "Kiara", "Avani", "Sneha", "Shruti", "Priya", "Neha", "Divya"
];

const INDIAN_SURNAMES = [
  "Sharma", "Patel", "Verma", "Rao", "Nair", "Kumar", "Iyer", "Rajesh", "Murthy", "Krishnan",
  "Reddy", "Mehta", "Singh", "Das", "Joshi", "Pillai", "Menon", "Bhat", "Gopal", "Subramanian"
];

async function seedStaging() {
  console.log("🌱 Starting realistic staging database seed...");

  // 1. Fetch core configurations
  const school = await prisma.school.findFirst() || await prisma.school.create({
    data: {
      id: "school-default",
      name: "Appu Arivaalayam",
      address: "School Address, City - 600001",
      phone: "+91 00000 00000",
      email: "admin@school.edu.in",
    }
  });

  const campus = await prisma.campus.findFirst() || await prisma.campus.create({
    data: {
      id: "campus-main",
      schoolId: school.id,
      name: "JSC",
      address: "Main Campus Address",
    }
  });

  const academicYear = await prisma.academicYear.findFirst({ where: { isActive: true } }) || await prisma.academicYear.create({
    data: {
      label: "2026-27",
      startYear: 2026,
      endYear: 2027,
      isActive: true,
      isCurrent: true,
    }
  });

  const documentTypes = await prisma.documentType.findMany();
  const photoDocType = documentTypes.find(d => d.name === "Student Photo") || await prisma.documentType.create({ data: { name: "Student Photo", isRequired: true } });
  const birthCertDocType = documentTypes.find(d => d.name === "Birth Certificate") || await prisma.documentType.create({ data: { name: "Birth Certificate", isRequired: true } });
  const transferCertDocType = documentTypes.find(d => d.name === "Transfer Certificate") || await prisma.documentType.create({ data: { name: "Transfer Certificate", isRequired: false } });

  const grades = await prisma.grade.findMany({ orderBy: { sortOrder: 'asc' } });
  if (grades.length === 0) {
    console.error("Please run baseline Prisma seeds first to populate Grades.");
    return;
  }

  // Find or create a bus route & stop
  const busRoute = await prisma.busRoute.findFirst() || await prisma.busRoute.create({
    data: {
      routeName: "Route A - City Center",
      busNo: "BUS-101",
      driverName: "Ramesh Singh",
      driverPhone: "9876543210"
    }
  });

  const busStop = await prisma.busStop.findFirst() || await prisma.busStop.create({
    data: {
      routeId: busRoute.id,
      stopName: "Central Junction",
      pickupTime: "07:30 AM",
      dropTime: "04:30 PM",
      distance: "5 km"
    }
  });

  // Find or create enquiry source
  const source = await prisma.enquirySource.findFirst() || await prisma.enquirySource.create({
    data: {
      name: "Parents Referral",
      type: "PARENTS"
    }
  });

  // Create a fee item if missing
  const feeItem = await prisma.feeItem.findFirst() || await prisma.feeItem.create({
    data: {
      name: "Tuition Fee",
      defaultAmount: 15000,
      isActive: true
    }
  });

  // 2. Clear onboarding transactional tables
  console.log("🧹 Cleaning up staging transaction tables...");
  await prisma.previousSchoolDetail.deleteMany({});
  await prisma.studentMedicalProfile.deleteMany({});
  await prisma.studentVaccination.deleteMany({});
  await prisma.siblingRelative.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.transportRequest.deleteMany({});
  await prisma.studentDocument.deleteMany({});
  await prisma.admissionStatusHistory.deleteMany({});
  await prisma.admissionApplication.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.guardian.deleteMany({});
  await prisma.family.deleteMany({});

  console.log("🚀 Generating 25 registrations & 20 admissions...");

  // Generate 25 registrations in total
  for (let i = 1; i <= 25; i++) {
    const isAdmission = i <= 20; // 20 admissions, 5 remaining as registration only
    const gender = i % 2 === 0 ? Gender.MALE : Gender.FEMALE;
    const firstName = gender === Gender.MALE 
      ? INDIAN_BOY_NAMES[i % INDIAN_BOY_NAMES.length] 
      : INDIAN_GIRL_NAMES[i % INDIAN_GIRL_NAMES.length];
    const lastName = INDIAN_SURNAMES[i % INDIAN_SURNAMES.length];
    const fullName = `${firstName} ${lastName}`;

    const fatherName = `${INDIAN_BOY_NAMES[(i + 2) % INDIAN_BOY_NAMES.length]} ${lastName}`;
    const motherName = `${INDIAN_GIRL_NAMES[(i + 3) % INDIAN_GIRL_NAMES.length]} ${lastName}`;

    // Distribute across first 5 grades
    const grade = grades[i % 5];

    // Create Family
    const family = await prisma.family.create({
      data: {}
    });

    // Create Guardian
    const guardian = await prisma.guardian.create({
      data: {
        familyId: family.id,
        fullName: fatherName,
        relationship: "FATHER",
        mobile: `9840${100000 + i}`,
        email: `${fatherName.toLowerCase().replace(" ", ".")}@mail.com`,
      }
    });

    // Create Student
    const student = await prisma.student.create({
      data: {
        familyId: family.id,
        fullNameEn: fullName,
        dateOfBirth: new Date(2020, 5, i),
        gender: gender,
        bloodGroup: "O+",
        religion: "Hindu",
        category: "General",
        address1: `${i * 12}, Gandhi Street`,
        city: "Chennai",
        state: "Tamil Nadu",
        pinCode: "600001"
      }
    });

    // Create Registration
    const regStatus = isAdmission ? RegistrationStatus.ADMITTED : RegistrationStatus.REGISTERED;
    const registration = await prisma.registration.create({
      data: {
        registrationNo: `REG-2026-${1000 + i}`,
        academicYearId: academicYear.id,
        campusId: campus.id,
        gradeId: grade.id,
        registrationDate: new Date(2026, 4, i),
        status: regStatus,
        studentId: student.id,
        studentName: fullName,
        dateOfBirth: new Date(2020, 5, i),
        gender: gender,
        fatherName: fatherName,
        fatherMobile: guardian.mobile,
        motherName: motherName,
        address1: student.address1,
        city: student.city,
        state: student.state,
        pinCode: student.pinCode,
        enquirySourceId: source.id
      }
    });

    // Handle Admissions Applications (for index 1 to 20)
    if (isAdmission) {
      let admStatus = AdmissionStatus.DRAFT;
      if (i <= 5) admStatus = AdmissionStatus.CONFIRMED;
      else if (i <= 10) admStatus = AdmissionStatus.DRAFT;
      else if (i <= 15) admStatus = AdmissionStatus.DRAFT; // In the UI, status defaults can represent pending verification
      else admStatus = AdmissionStatus.CANCELLED; // Rejected status

      const admission = await prisma.admissionApplication.create({
        data: {
          admissionNo: `ADM-2026-${1000 + i}`,
          registrationId: registration.id,
          academicYearId: academicYear.id,
          campusId: campus.id,
          gradeId: grade.id,
          studentId: student.id,
          status: admStatus,
          confirmedAt: admStatus === AdmissionStatus.CONFIRMED ? new Date() : null
        }
      });

      // 3. Documents distribution
      // Category 1: Complete documents (Index 1 to 5)
      // Category 2: Missing Birth Certificate (Index 6 to 10)
      // Category 3: Missing Student Photo (Index 11 to 15)
      // Category 4: Missing Transfer Certificate (Index 16 to 20)
      
      const verifiedStatus = DocumentStatus.VERIFIED;
      const missingStatus = DocumentStatus.NOT_RECEIVED;

      // Student Photo
      await prisma.studentDocument.create({
        data: {
          studentId: student.id,
          documentTypeId: photoDocType.id,
          status: (i >= 11 && i <= 15) ? missingStatus : verifiedStatus,
          originalFilename: (i >= 11 && i <= 15) ? null : "photo.jpg"
        }
      });

      // Birth Certificate
      await prisma.studentDocument.create({
        data: {
          studentId: student.id,
          documentTypeId: birthCertDocType.id,
          status: (i >= 6 && i <= 10) ? missingStatus : verifiedStatus,
          originalFilename: (i >= 6 && i <= 10) ? null : "birth_certificate.pdf"
        }
      });

      // Transfer Certificate
      await prisma.studentDocument.create({
        data: {
          studentId: student.id,
          documentTypeId: transferCertDocType.id,
          status: (i >= 16 && i <= 20) ? missingStatus : verifiedStatus,
          originalFilename: (i >= 16 && i <= 20) ? null : "tc.pdf"
        }
      });

      // 4. Fees Configuration
      // 7 Fully Paid (amount = 15000, status = PAID) (i = 1 to 7)
      // 7 Partially Paid (amount = 15000, status = PARTIAL; pay 5000) (i = 8 to 14)
      // 6 Outstanding (status = PENDING; pay 0) (i = 15 to 20)
      
      let payStatus = PaymentStatus.PENDING;
      let payAmount = 0;
      if (i <= 7) {
        payStatus = PaymentStatus.PAID;
        payAmount = 15000;
      } else if (i <= 14) {
        payStatus = PaymentStatus.PARTIAL;
        payAmount = 5000;
      }

      await prisma.payment.create({
        data: {
          admissionId: admission.id,
          receiptNo: `REC-2026-${1000 + i}`,
          feeItemId: feeItem.id,
          feeType: "Tuition Fee",
          amount: payAmount,
          paymentMode: PaymentMode.UPI,
          paymentStatus: payStatus,
          paymentDate: payAmount > 0 ? new Date() : null
        }
      });

      // 5. Transport Configuration
      // 7 Assigned (required = true, routeId/stopId set) (i = 1 to 7)
      // 7 Pending (required = true, routeId/stopId null) (i = 8 to 14)
      // 6 Not Requested (required = false) (i = 15 to 20)
      
      const transportRequired = i <= 14;
      const transportAssigned = i <= 7;

      await prisma.transportRequest.create({
        data: {
          admissionId: admission.id,
          required: transportRequired,
          routeId: transportAssigned ? busRoute.id : null,
          stopId: transportAssigned ? busStop.id : null,
          remarks: transportRequired ? "Needs transport facility" : "No transport needed"
        }
      });
    }
  }

  // 6. Set Grade 1 capacity nearly full to test risk capacity alerts
  const grade1 = grades.find(g => g.name.includes("Grade 1"));
  if (grade1) {
    await prisma.gradeSeatCapacity.updateMany({
      where: {
        academicYearId: academicYear.id,
        gradeId: grade1.id,
        campusId: campus.id
      },
      data: {
        totalSeats: 10 // Setting capacity to 10 (we have 9 students assigned to it under our loop distribution)
      }
    });
  }

  console.log("✅ Seed complete! Fetching database verification metrics...");

  // Verification Counts
  const totalRegs = await prisma.registration.count();
  const totalAdmissions = await prisma.admissionApplication.count();
  const totalConfirmed = await prisma.admissionApplication.count({ where: { status: AdmissionStatus.CONFIRMED } });

  // Missing documents verification status
  const missingBirthCert = await prisma.studentDocument.count({
    where: {
      documentType: { name: "Birth Certificate" },
      status: DocumentStatus.NOT_RECEIVED
    }
  });

  const missingPhoto = await prisma.studentDocument.count({
    where: {
      documentType: { name: "Student Photo" },
      status: DocumentStatus.NOT_RECEIVED
    }
  });

  // Calculate outstanding totals
  const totalOutstanding = 20 * 15000; // 20 admissions * 15000 tuition fee base
  const totalPaid = await prisma.payment.aggregate({
    _sum: { amount: true }
  });

  // Transport allocations
  const transportAssignedCount = await prisma.transportRequest.count({
    where: { required: true, routeId: { not: null } }
  });
  const transportPendingCount = await prisma.transportRequest.count({
    where: { required: true, routeId: null }
  });

  console.log("\n=== DATABASE SEED VERIFICATION ===");
  console.log(`- Total Registrations      : ${totalRegs}`);
  console.log(`- Total Admissions         : ${totalAdmissions}`);
  console.log(`- Confirmed Admissions     : ${totalConfirmed}`);
  console.log(`- Missing Birth Certificate: ${missingBirthCert}`);
  console.log(`- Missing Student Photo    : ${missingPhoto}`);
  console.log(`- Outstanding Fee Balance  : ₹${totalOutstanding - Number(totalPaid._sum.amount || 0)}`);
  console.log(`- Transport Assigned       : ${transportAssignedCount}`);
  console.log(`- Transport Pending        : ${transportPendingCount}`);
  console.log("==================================\n");
}

seedStaging()
  .catch(err => {
    console.error("Error during staging seed:", err);
    process.exit(1);
  });
