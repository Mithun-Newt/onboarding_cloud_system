import { prisma } from "@/lib/prisma";

export interface ReportFilter {
  academicYearId?: string;
  gradeId?: string;
  campusId?: string;
  startDate?: string;
  endDate?: string;
}

export async function registrationSummaryReport(filter: ReportFilter) {
  const where: any = {};
  if (filter.academicYearId) where.academicYearId = filter.academicYearId;
  if (filter.gradeId) where.gradeId = filter.gradeId;
  if (filter.campusId) where.campusId = filter.campusId;
  if (filter.startDate || filter.endDate) {
    where.registrationDate = {};
    if (filter.startDate) where.registrationDate.gte = new Date(filter.startDate);
    if (filter.endDate) where.registrationDate.lte = new Date(filter.endDate);
  }

  return prisma.registration.findMany({
    where,
    include: { grade: true, academicYear: true, campus: true, enquirySource: true },
    orderBy: { registrationDate: "desc" },
  });
}

export async function admissionSummaryReport(filter: ReportFilter) {
  const where: any = { status: "CONFIRMED" };
  if (filter.academicYearId) where.academicYearId = filter.academicYearId;
  if (filter.gradeId) where.gradeId = filter.gradeId;
  if (filter.campusId) where.campusId = filter.campusId;

  return prisma.admissionApplication.findMany({
    where,
    include: {
      grade: true,
      academicYear: true,
      campus: true,
      student: { select: { fullNameEn: true, dateOfBirth: true, gender: true } },
      registration: { select: { registrationNo: true, enquirySource: true } },
    },
    orderBy: { confirmedAt: "desc" },
  });
}

export async function pendingDocumentsReport(filter: ReportFilter) {
  const where: any = { status: { in: ["NOT_RECEIVED", "UPLOADED"] } };

  return prisma.studentDocument.findMany({
    where,
    include: {
      student: {
        select: {
          fullNameEn: true,
          admissions: {
            where: filter.academicYearId ? { academicYearId: filter.academicYearId } : {},
            select: { admissionNo: true, grade: { select: { name: true } } },
            take: 1,
          },
        },
      },
      documentType: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function feeCollectedReport(filter: ReportFilter) {
  const admissionWhere: any = {};
  if (filter.academicYearId) admissionWhere.academicYearId = filter.academicYearId;

  const where: any = {
    paymentStatus: { in: ["PAID", "WAIVED"] },
    admission: admissionWhere,
  };
  if (filter.startDate || filter.endDate) {
    where.paymentDate = {};
    if (filter.startDate) where.paymentDate.gte = new Date(filter.startDate);
    if (filter.endDate) where.paymentDate.lte = new Date(filter.endDate);
  }

  return prisma.payment.findMany({
    where,
    include: {
      admission: {
        include: {
          student: { select: { fullNameEn: true } },
          grade: true,
        },
      },
      collectedBy: { select: { fullName: true } },
    },
    orderBy: { paymentDate: "desc" },
  });
}

export async function feePendingReport(filter: ReportFilter) {
  const admissionWhere: any = {};
  if (filter.academicYearId) admissionWhere.academicYearId = filter.academicYearId;

  return prisma.payment.findMany({
    where: {
      paymentStatus: { in: ["PENDING", "PARTIAL"] },
      admission: admissionWhere,
    },
    include: {
      admission: {
        include: {
          student: { select: { fullNameEn: true } },
          grade: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function seatAvailabilityReport(filter: ReportFilter) {
  const capacities = await prisma.gradeSeatCapacity.findMany({
    where: filter.academicYearId ? { academicYearId: filter.academicYearId } : {},
    include: { grade: true, campus: true, academicYear: true },
  });

  const confirmed = await prisma.admissionApplication.groupBy({
    by: ["gradeId", "campusId", "academicYearId"],
    where: {
      status: "CONFIRMED",
      ...(filter.academicYearId ? { academicYearId: filter.academicYearId } : {}),
    },
    _count: { id: true },
  });

  return capacities.map((cap) => {
    const admitted =
      confirmed.find(
        (c) => c.gradeId === cap.gradeId && c.campusId === cap.campusId && c.academicYearId === cap.academicYearId
      )?._count.id ?? 0;
    return {
      grade: cap.grade.name,
      campus: cap.campus.name,
      year: cap.academicYear.label,
      totalSeats: cap.totalSeats,
      admitted,
      available: Math.max(0, cap.totalSeats - admitted),
    };
  });
}

export async function sourceWiseReport(filter: ReportFilter) {
  const where: any = {};
  if (filter.academicYearId) where.academicYearId = filter.academicYearId;

  const data = await prisma.registration.groupBy({
    by: ["enquirySourceId"],
    where,
    _count: { id: true },
  });

  const sources = await prisma.enquirySource.findMany();
  return data.map((d) => ({
    source: sources.find((s) => s.id === d.enquirySourceId)?.name ?? "Unknown",
    count: d._count.id,
  }));
}

export async function medicalSpecialSupportReport(filter: ReportFilter) {
  const where: any = { specialSupport: true };
  if (filter.academicYearId) where.academicYearId = filter.academicYearId;

  return prisma.registration.findMany({
    where,
    include: { grade: true, academicYear: true },
    orderBy: { registrationDate: "desc" },
  });
}

export async function transportReport(filter: ReportFilter) {
  return prisma.transportRequest.findMany({
    where: {
      required: true,
      ...(filter.academicYearId
        ? { admission: { academicYearId: filter.academicYearId } }
        : {}),
    },
    include: {
      admission: {
        include: {
          student: { select: { fullNameEn: true } },
          grade: true,
        },
      },
      route: true,
      stop: true,
    },
  });
}
