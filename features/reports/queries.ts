import { prisma } from "@/lib/prisma";

export interface ReportFilter {
  academicYearId?: string;
  gradeId?: string;
  campusId?: string;
  startDate?: string;
  endDate?: string;
}

export async function registrationSummaryReport(filter: ReportFilter) {
  try {
    const where: any = {};
    if (filter.academicYearId) where.academicYearId = filter.academicYearId;
    if (filter.gradeId) where.gradeId = filter.gradeId;
    if (filter.campusId) where.campusId = filter.campusId;
    if (filter.startDate || filter.endDate) {
      where.registrationDate = {};
      if (filter.startDate) where.registrationDate.gte = new Date(filter.startDate);
      if (filter.endDate) where.registrationDate.lte = new Date(filter.endDate);
    }

    return await prisma.registration.findMany({
      where,
      include: { grade: true, academicYear: true, campus: true, enquirySource: true },
      orderBy: { registrationDate: "desc" },
    });
  } catch (error) {
    console.error("REGISTRATION_SUMMARY_REPORT_ERROR:", error);
    return [];
  }
}

export async function admissionSummaryReport(filter: ReportFilter) {
  try {
    const where: any = { status: { in: ["CONFIRMED", "TC_ISSUED"] } };
    if (filter.academicYearId) where.academicYearId = filter.academicYearId;
    if (filter.gradeId) where.gradeId = filter.gradeId;
    if (filter.campusId) where.campusId = filter.campusId;

    return await prisma.admissionApplication.findMany({
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
  } catch (error) {
    console.error("ADMISSION_SUMMARY_REPORT_ERROR:", error);
    return [];
  }
}

export async function pendingDocumentsReport(filter: ReportFilter) {
  try {
    const where: any = {
      status: { in: ["NOT_RECEIVED", "UPLOADED", "REJECTED"] },
      documentType: { isRequired: true }
    };

    return await prisma.studentDocument.findMany({
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
  } catch (error) {
    console.error("PENDING_DOCUMENTS_REPORT_ERROR:", error);
    return [];
  }
}

export async function feeCollectedReport(filter: ReportFilter) {
  try {
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

    return await prisma.payment.findMany({
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
  } catch (error) {
    console.error("FEE_COLLECTED_REPORT_ERROR:", error);
    return [];
  }
}

export async function feePendingReport(filter: ReportFilter) {
  try {
    const admissionWhere: any = {};
    if (filter.academicYearId) admissionWhere.academicYearId = filter.academicYearId;

    return await prisma.payment.findMany({
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
  } catch (error) {
    console.error("FEE_PENDING_REPORT_ERROR:", error);
    return [];
  }
}

export async function seatAvailabilityReport(filter: ReportFilter) {
  try {
    const capacities = await prisma.gradeSeatCapacity.findMany({
      where: filter.academicYearId ? { academicYearId: filter.academicYearId } : {},
      include: { grade: true, campus: true, academicYear: true },
    });

    const confirmed = await prisma.admissionApplication.groupBy({
      by: ["gradeId", "campusId", "academicYearId"],
      where: {
        status: { in: ["CONFIRMED", "TC_ISSUED"] },
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
  } catch (error) {
    console.error("SEAT_AVAILABILITY_REPORT_ERROR:", error);
    return [];
  }
}

export async function sourceWiseReport(filter: ReportFilter) {
  try {
    const where: any = {};
    if (filter.academicYearId) where.academicYearId = filter.academicYearId;

    const data = await prisma.registration.groupBy({
      by: ["enquirySourceId"],
      where,
      _count: { id: true },
    });

    const sources = await prisma.enquirySource.findMany();
    return data.map((d) => ({
      source: sources?.find((s) => s.id === d.enquirySourceId)?.name ?? "Not Specified",
      count: d._count.id,
    }));
  } catch (error) {
    console.error("SOURCE_WISE_REPORT_ERROR:", error);
    return [];
  }
}

export async function medicalSpecialSupportReport(filter: ReportFilter) {
  try {
    const where: any = { specialSupport: true };
    if (filter.academicYearId) where.academicYearId = filter.academicYearId;

    return await prisma.registration.findMany({
      where,
      include: { grade: true, academicYear: true },
      orderBy: { registrationDate: "desc" },
    });
  } catch (error) {
    console.error("MEDICAL_SPECIAL_SUPPORT_REPORT_ERROR:", error);
    return [];
  }
}

export async function transportReport(filter: ReportFilter) {
  try {
    return await prisma.transportRequest.findMany({
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
  } catch (error) {
    console.error("TRANSPORT_REPORT_ERROR:", error);
    return [];
  }
}

export async function previousSchoolReport(filter: ReportFilter) {
  try {
    return await prisma.previousSchoolDetail.findMany({
      where: filter.academicYearId
        ? { admission: { academicYearId: filter.academicYearId } }
        : {},
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
  } catch (error) {
    console.error("PREVIOUS_SCHOOL_REPORT_ERROR:", error);
    return [];
  }
}

export async function vaccinationPendingReport(filter: ReportFilter) {
  try {
    return await prisma.studentVaccination.findMany({
      where: {
        status: { not: "DONE" },
        student: filter.academicYearId
          ? { admissions: { some: { academicYearId: filter.academicYearId } } }
          : {},
      },
      include: {
        student: {
          select: {
            fullNameEn: true,
            admissions: {
              select: { admissionNo: true, grade: { select: { name: true } } },
              take: 1,
            },
          },
        },
        vaccine: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("VACCINATION_PENDING_REPORT_ERROR:", error);
    return [];
  }
}

export async function meetingSummaryReport(filter: ReportFilter) {
  try {
    const admissions = await prisma.admissionApplication.findMany({
      where: {
        status: { in: ["CONFIRMED", "TC_ISSUED"] },
        ...(filter.academicYearId ? { academicYearId: filter.academicYearId } : {}),
      },
      include: {
        student: { select: { fullNameEn: true } },
        grade: true,
        campus: true,
      },
      orderBy: { confirmedAt: "desc" },
    });

    const summary = {
      totalAdmissions: admissions.length,
      byGrade: {} as Record<string, number>,
      byCampus: {} as Record<string, number>,
    };

    admissions.forEach((a) => {
      summary.byGrade[a.grade.name] = (summary.byGrade[a.grade.name] ?? 0) + 1;
      summary.byCampus[a.campus.name] = (summary.byCampus[a.campus.name] ?? 0) + 1;
    });

    return [summary];
  } catch (error) {
    console.error("MEETING_SUMMARY_REPORT_ERROR:", error);
    return [];
  }
}
