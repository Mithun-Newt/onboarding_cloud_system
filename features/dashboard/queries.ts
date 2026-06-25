import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { getCohortStrengths } from "./cohort-actions";

export async function getDashboardStats(academicYearId?: string) {
  const today = new Date();
  const startToday = startOfDay(today);
  const endToday = endOfDay(today);

  const whereYear = academicYearId ? { academicYearId } : {};

  let activeYearId = academicYearId;
  if (!activeYearId) {
    const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    activeYearId = currentYear?.id;
  }

  const [
    todayRegistrations,
    todayConfirmed,
    pendingDocuments,
    feePending,
    registrationsByGrade,
    admissionsByGrade,
    seatCapacity,
    sourceWise,
    specialSupport,
    transportRequired,
    cohortStrengths,
  ] = await Promise.all([
    prisma.registration.count({
      where: { ...whereYear, registrationDate: { gte: startToday, lte: endToday } },
    }),
    prisma.admissionApplication.count({
      where: { ...whereYear, status: { in: ["CONFIRMED", "TC_ISSUED"] }, confirmedAt: { gte: startToday, lte: endToday } },
    }),
    prisma.studentDocument.count({
      where: {
        status: { in: ["NOT_RECEIVED", "UPLOADED", "REJECTED"] },
        documentType: { isRequired: true },
      },
    }),
    prisma.payment.count({
      where: { paymentStatus: { in: ["PENDING", "PARTIAL"] } },
    }),
    prisma.registration.groupBy({
      by: ["gradeId"],
      where: whereYear,
      _count: { id: true },
    }),
    prisma.admissionApplication.groupBy({
      by: ["gradeId"],
      where: { ...whereYear, status: { in: ["CONFIRMED", "TC_ISSUED"] } },
      _count: { id: true },
    }),
    prisma.gradeSeatCapacity.findMany({
      where: whereYear,
      include: { grade: true },
    }),
    prisma.registration.groupBy({
      by: ["enquirySourceId"],
      where: whereYear,
      _count: { id: true },
    }),
    prisma.registration.count({
      where: { ...whereYear, specialSupport: true },
    }),
    prisma.transportRequest.count({
      where: { required: true },
    }),
    activeYearId ? getCohortStrengths(activeYearId) : Promise.resolve([]),
  ]);

  const grades = await prisma.grade.findMany({ orderBy: { sortOrder: "asc" } });
  const enquirySources = await prisma.enquirySource.findMany();

  const admittedByGrade = admissionsByGrade.reduce(
    (acc, a) => { acc[a.gradeId] = a._count.id; return acc; },
    {} as Record<string, number>
  );

  const dbConfirmedCounts = grades.reduce(
    (acc, g) => {
      acc[g.name] = admittedByGrade[g.id] ?? 0;
      return acc;
    },
    {} as Record<string, number>
  );

  const seatInfo = grades.map((g) => {
    const admitted = admittedByGrade[g.id] ?? 0;

    const matchedCohort = cohortStrengths.find((c) => c.className === g.name);

    const total = matchedCohort ? matchedCohort.target : 70;
    const cohortAchieved = matchedCohort
      ? (matchedCohort.promotedStrength - matchedCohort.tc + matchedCohort.newAdmission)
      : 0;
    const cohortVacancy = matchedCohort ? (matchedCohort.target - cohortAchieved) : 70;

    const filled = cohortAchieved + admitted;
    const remainingVacancy = cohortVacancy - admitted;
    const isExceeded = remainingVacancy <= 0;

    return {
      grade: g.name,
      total,
      admitted,
      filled,
      cohortVacancy,
      remainingVacancy,
      isExceeded,
    };
  });

  const regByGrade = registrationsByGrade.reduce(
    (acc, r) => { acc[r.gradeId] = r._count.id; return acc; },
    {} as Record<string, number>
  );

  const gradeStats = grades.map((g) => ({
    grade: g.name,
    registrations: regByGrade[g.id] ?? 0,
    admissions: admittedByGrade[g.id] ?? 0,
  }));

  const sourceStats = sourceWise.map((s) => {
    const src = enquirySources.find((e) => e.id === s.enquirySourceId);
    return { source: src?.name ?? "Not Specified", count: s._count.id };
  });

  return {
    todayRegistrations,
    todayConfirmed,
    pendingDocuments,
    feePending,
    specialSupport,
    transportRequired,
    gradeStats,
    seatInfo,
    sourceStats,
    dbConfirmedCounts,
  };
}

export async function getCurrentAcademicYear() {
  return prisma.academicYear.findFirst({ where: { isCurrent: true } });
}

export async function getAllAcademicYears() {
  return prisma.academicYear.findMany({ orderBy: { startYear: "desc" } });
}
