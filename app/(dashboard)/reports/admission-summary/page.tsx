import { admissionSummaryReport } from "@/features/reports/queries";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ReportLayout } from "@/components/reports/report-layout";
import { ReportFilters } from "@/components/reports/report-filters";

export const dynamic = "force-dynamic";

export default async function AdmissionSummaryPage({ searchParams }: { searchParams: { academicYearId?: string; gradeId?: string } }) {
  const [data, academicYears, grades, campuses] = await Promise.all([
    admissionSummaryReport(searchParams),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.grade.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.campus.findMany(),
  ]);

  const csvData = data.map((a) => ({
    "Admission No": a.admissionNo ?? "",
    "Reg No": a.registration.registrationNo,
    "Student": a.student.fullNameEn,
    "DOB": formatDate(a.student.dateOfBirth),
    "Gender": a.student.gender,
    "Grade": a.grade.name,
    "Campus": a.campus.name,
    "Academic Year": a.academicYear.label,
    "Confirmed On": a.confirmedAt ? formatDate(a.confirmedAt) : "",
  }));

  return (
    <ReportLayout title="Admission Summary" csvData={csvData} csvFilename="admission-summary.csv">
      <ReportFilters academicYears={academicYears} grades={grades} campuses={campuses} />
      <div className="rounded-lg border bg-white overflow-x-auto text-sm">
        <div className="px-4 py-2 border-b text-xs text-muted-foreground">{data.length} confirmed admissions</div>
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Adm No</th>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">DOB</th>
              <th className="px-4 py-3 font-medium">Gender</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Year</th>
              <th className="px-4 py-3 font-medium">Confirmed</th>
            </tr>
          </thead>
          <tbody>
            {data.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-green-700">{a.admissionNo}</td>
                <td className="px-4 py-3 font-medium">{a.student.fullNameEn}</td>
                <td className="px-4 py-3">{formatDate(a.student.dateOfBirth)}</td>
                <td className="px-4 py-3">{a.student.gender}</td>
                <td className="px-4 py-3">{a.grade.name}</td>
                <td className="px-4 py-3">{a.academicYear.label}</td>
                <td className="px-4 py-3">{a.confirmedAt ? formatDate(a.confirmedAt) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
