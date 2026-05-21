import { medicalSpecialSupportReport } from "@/features/reports/queries";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ReportLayout } from "@/components/reports/report-layout";
import { ReportFilters } from "@/components/reports/report-filters";

export const dynamic = "force-dynamic";

export default async function SpecialSupportPage({ searchParams }: { searchParams: { academicYearId?: string } }) {
  const [data, academicYears, grades] = await Promise.all([
    medicalSpecialSupportReport(searchParams),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.grade.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const csvData = data.map((r) => ({
    "Reg No": r.registrationNo,
    "Student": r.studentName,
    "DOB": formatDate(r.dateOfBirth),
    "Grade": r.grade.name,
    "Support Details": r.specialDetails ?? "",
    "Reg Date": formatDate(r.registrationDate),
  }));

  return (
    <ReportLayout title="Special Educational Support" csvData={csvData} csvFilename="special-support.csv">
      <ReportFilters academicYears={academicYears} grades={grades} />
      <div className="rounded-lg border bg-white overflow-x-auto text-sm">
        <div className="px-4 py-2 border-b text-xs text-muted-foreground">{data.length} students flagged for special support</div>
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Reg No</th>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Support Details</th>
              <th className="px-4 py-3 font-medium">Reg Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-blue-700">{r.registrationNo}</td>
                <td className="px-4 py-3 font-medium">{r.studentName}</td>
                <td className="px-4 py-3">{r.grade.name}</td>
                <td className="px-4 py-3">{r.specialDetails ?? "-"}</td>
                <td className="px-4 py-3">{formatDate(r.registrationDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
