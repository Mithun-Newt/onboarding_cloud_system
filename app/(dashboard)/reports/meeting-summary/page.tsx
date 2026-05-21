import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ReportLayout } from "@/components/reports/report-layout";
import { ReportFilters } from "@/components/reports/report-filters";
import { startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

interface SearchParams {
  academicYearId?: string;
  startDate?: string;
  endDate?: string;
}

export default async function MeetingSummaryPage({ searchParams }: { searchParams: SearchParams }) {
  const start = searchParams.startDate ? startOfDay(new Date(searchParams.startDate)) : startOfDay(new Date());
  const end = searchParams.endDate ? endOfDay(new Date(searchParams.endDate)) : endOfDay(new Date());
  const where = searchParams.academicYearId ? { academicYearId: searchParams.academicYearId } : {};

  const [academicYears, registrations, admissions, payments] = await Promise.all([
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.registration.count({ where: { ...where, registrationDate: { gte: start, lte: end } } }),
    prisma.admissionApplication.count({ where: { ...where, status: "CONFIRMED", confirmedAt: { gte: start, lte: end } } }),
    prisma.payment.aggregate({
      where: { paymentStatus: "PAID", paymentDate: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  const totalCollected = Number(payments._sum.amount ?? 0);

  return (
    <ReportLayout title="Meeting / Daily Summary">
      <ReportFilters academicYears={academicYears} showDateRange />
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-6 text-center">
          <p className="text-4xl font-bold text-blue-600">{registrations}</p>
          <p className="mt-2 text-sm text-muted-foreground">Registrations</p>
        </div>
        <div className="rounded-lg border bg-white p-6 text-center">
          <p className="text-4xl font-bold text-green-600">{admissions}</p>
          <p className="mt-2 text-sm text-muted-foreground">Admissions Confirmed</p>
        </div>
        <div className="rounded-lg border bg-white p-6 text-center">
          <p className="text-4xl font-bold text-purple-600">{formatCurrency(totalCollected)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Fees Collected</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Showing data from {formatDate(start)} to {formatDate(end)}
      </p>
    </ReportLayout>
  );
}
