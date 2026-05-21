import { feeCollectedReport } from "@/features/reports/queries";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ReportLayout } from "@/components/reports/report-layout";
import { ReportFilters } from "@/components/reports/report-filters";

export const dynamic = "force-dynamic";

interface SearchParams {
  academicYearId?: string;
  startDate?: string;
  endDate?: string;
}

export default async function FeeCollectedPage({ searchParams }: { searchParams: SearchParams }) {
  const [data, academicYears] = await Promise.all([
    feeCollectedReport(searchParams),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
  ]);

  const total = data.reduce((sum, p) => sum + Number(p.amount), 0);

  const csvData = data.map((p) => ({
    "Receipt No": p.receiptNo ?? "",
    "Student": p.admission.student.fullNameEn,
    "Grade": p.admission.grade.name,
    "Fee Type": p.feeType,
    "Amount": p.amount.toString(),
    "Mode": p.paymentMode,
    "Date": p.paymentDate ? formatDate(p.paymentDate) : "",
    "Collected By": p.collectedBy?.fullName ?? "",
    "Status": p.paymentStatus,
  }));

  return (
    <ReportLayout title="Fee Collected Report" csvData={csvData} csvFilename="fee-collected.csv">
      <ReportFilters academicYears={academicYears} showDateRange />
      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
        <p className="text-sm text-green-700">Total Collected</p>
        <p className="text-3xl font-bold text-green-700">{formatCurrency(total)}</p>
        <p className="text-xs text-green-600">{data.length} transactions</p>
      </div>
      <div className="rounded-lg border bg-white overflow-x-auto text-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Receipt No</th>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Fee Type</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Mode</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Collected By</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-4 py-2 font-mono text-xs text-green-700">{p.receiptNo ?? "-"}</td>
                <td className="px-4 py-2 font-medium">{p.admission.student.fullNameEn}</td>
                <td className="px-4 py-2">{p.admission.grade.name}</td>
                <td className="px-4 py-2">{p.feeType}</td>
                <td className="px-4 py-2 font-semibold">{formatCurrency(Number(p.amount))}</td>
                <td className="px-4 py-2">{p.paymentMode}</td>
                <td className="px-4 py-2">{p.paymentDate ? formatDate(p.paymentDate) : "-"}</td>
                <td className="px-4 py-2">{p.collectedBy?.fullName ?? "-"}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
