import { feePendingReport } from "@/features/reports/queries";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { ReportLayout } from "@/components/reports/report-layout";
import { ReportFilters } from "@/components/reports/report-filters";

export const dynamic = "force-dynamic";

export default async function FeePendingPage({ searchParams }: { searchParams: { academicYearId?: string } }) {
  const [data, academicYears] = await Promise.all([
    feePendingReport(searchParams),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
  ]);

  const total = data.reduce((sum, p) => sum + Number(p.amount), 0);

  const csvData = data.map((p) => ({
    Student: p.admission.student.fullNameEn,
    Grade: p.admission.grade.name,
    "Fee Type": p.feeType,
    Amount: p.amount.toString(),
    Status: p.paymentStatus,
  }));

  return (
    <ReportLayout title="Fee Pending" csvData={csvData} csvFilename="fee-pending.csv">
      <ReportFilters academicYears={academicYears} />
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
        <p className="text-sm text-red-700">Total Pending</p>
        <p className="text-3xl font-bold text-red-700">{formatCurrency(total)}</p>
        <p className="text-xs text-red-500">{data.length} records</p>
      </div>
      <div className="rounded-lg border bg-white overflow-x-auto text-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Fee Type</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{p.admission.student.fullNameEn}</td>
                <td className="px-4 py-3">{p.admission.grade.name}</td>
                <td className="px-4 py-3">{p.feeType}</td>
                <td className="px-4 py-3 text-red-600 font-semibold">{formatCurrency(Number(p.amount))}</td>
                <td className="px-4 py-3">{p.paymentStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
