import { transportReport } from "@/features/reports/queries";
import { prisma } from "@/lib/prisma";
import { ReportLayout } from "@/components/reports/report-layout";
import { ReportFilters } from "@/components/reports/report-filters";

export const dynamic = "force-dynamic";

export default async function TransportReportPage({ searchParams }: { searchParams: { academicYearId?: string } }) {
  const [data, academicYears] = await Promise.all([
    transportReport(searchParams),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
  ]);

  const csvData = data.map((t) => ({
    "Student Name": t.admission.student.fullNameEn,
    "Grade": t.admission.grade.name,
    "Route": t.route?.name ?? "-",
    "Stop": t.stop?.stopName ?? "-",
    "Stage": t.stop?.stage ?? "-",
    "Pickup Time": t.stop?.pickupTime ?? "-",
    "Drop Time": t.stop?.dropTime ?? "-",
    "Remarks": t.remarks ?? "",
  }));

  return (
    <ReportLayout title="Transport Report" csvData={csvData} csvFilename="transport.csv">
      <ReportFilters academicYears={academicYears} />
      <div className="rounded-lg border bg-white overflow-x-auto text-sm">
        <div className="px-4 py-2 border-b text-xs text-muted-foreground">{data.length} students requiring transport</div>
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Route</th>
              <th className="px-4 py-3 font-medium">Stop</th>
              <th className="px-4 py-3 font-medium">Pickup</th>
              <th className="px-4 py-3 font-medium">Drop</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{t.admission.student.fullNameEn}</td>
                <td className="px-4 py-3">{t.admission.grade.name}</td>
                <td className="px-4 py-3">{t.route?.name ?? "-"}</td>
                <td className="px-4 py-3">{t.stop?.stopName ?? "-"}</td>
                <td className="px-4 py-3">{t.stop?.pickupTime ?? "-"}</td>
                <td className="px-4 py-3">{t.stop?.dropTime ?? "-"}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No transport requests recorded.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
