import { registrationSummaryReport } from "@/features/reports/queries";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ReportLayout } from "@/components/reports/report-layout";
import { ReportFilters } from "@/components/reports/report-filters";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface SearchParams {
  academicYearId?: string;
  gradeId?: string;
  startDate?: string;
  endDate?: string;
}

const STATUS_BADGES: Record<string, { variant: any }> = {
  REGISTERED: { variant: "info" },
  ADMISSION_STARTED: { variant: "warning" },
  ADMITTED: { variant: "success" },
  CANCELLED: { variant: "destructive" },
};

export default async function RegistrationSummaryPage({ searchParams }: { searchParams: SearchParams }) {
  const [data, academicYears, grades, campuses] = await Promise.all([
    registrationSummaryReport(searchParams),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.grade.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.campus.findMany(),
  ]);

  const csvData = data.map((r) => ({
    "Reg No": r.registrationNo,
    "Student Name": r.studentName,
    DOB: formatDate(r.dateOfBirth),
    Gender: r.gender,
    Grade: r.grade.name,
    "Academic Year": r.academicYear.label,
    "Father Mobile": r.fatherMobile ?? "",
    "Mother Mobile": r.motherMobile ?? "",
    "Enquiry Source": r.enquirySource?.name ?? "",
    "Special Support": r.specialSupport ? "Yes" : "No",
    Status: r.status,
    "Reg Date": formatDate(r.registrationDate),
  }));

  return (
    <ReportLayout title="Registration Summary" csvData={csvData} csvFilename="registration-summary.csv">
      <ReportFilters academicYears={academicYears} grades={grades} campuses={campuses} showDateRange />
      <div className="rounded-lg border bg-white text-sm">
        <div className="px-4 py-2 border-b text-xs text-muted-foreground">
          {data.length} record{data.length !== 1 ? "s" : ""}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Reg No</th>
                <th className="px-4 py-3 font-medium">Student Name</th>
                <th className="px-4 py-3 font-medium">DOB</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Special</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => {
                const s = STATUS_BADGES[r.status] ?? { variant: "outline" };
                return (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs text-blue-700">{r.registrationNo}</td>
                    <td className="px-4 py-2 font-medium">{r.studentName}</td>
                    <td className="px-4 py-2">{formatDate(r.dateOfBirth)}</td>
                    <td className="px-4 py-2">{r.grade.name}</td>
                    <td className="px-4 py-2">{r.fatherMobile || r.motherMobile || "-"}</td>
                    <td className="px-4 py-2">{r.enquirySource?.name ?? "-"}</td>
                    <td className="px-4 py-2">{r.specialSupport ? "Yes" : "No"}</td>
                    <td className="px-4 py-2">{formatDate(r.registrationDate)}</td>
                    <td className="px-4 py-2"><Badge variant={s.variant}>{r.status}</Badge></td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">No data for selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ReportLayout>
  );
}
