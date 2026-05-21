import { prisma } from "@/lib/prisma";
import { ReportLayout } from "@/components/reports/report-layout";
import { ReportFilters } from "@/components/reports/report-filters";

export const dynamic = "force-dynamic";

export default async function PreviousSchoolPage({ searchParams }: { searchParams: { academicYearId?: string } }) {
  const [data, academicYears] = await Promise.all([
    prisma.previousSchoolDetail.findMany({
      include: {
        admission: {
          include: {
            student: { select: { fullNameEn: true } },
            grade: true,
            academicYear: true,
          },
        },
      },
      where: searchParams.academicYearId ? { admission: { academicYearId: searchParams.academicYearId } } : {},
    }),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
  ]);

  return (
    <ReportLayout title="Previous School Details" csvData={data.map((d) => ({ Student: d.admission.student.fullNameEn, Grade: d.admission.grade.name, "Previous School": d.schoolName ?? "", "Last Class": d.lastClassPassed ?? "", "TC No": d.tcNumber ?? "" }))} csvFilename="previous-school.csv">
      <ReportFilters academicYears={academicYears} />
      <div className="rounded-lg border bg-white overflow-x-auto text-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Previous School</th>
              <th className="px-4 py-3 font-medium">Last Class</th>
              <th className="px-4 py-3 font-medium">TC No</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{d.admission.student.fullNameEn}</td>
                <td className="px-4 py-3">{d.admission.grade.name}</td>
                <td className="px-4 py-3">{d.schoolName ?? "-"}</td>
                <td className="px-4 py-3">{d.lastClassPassed ?? "-"}</td>
                <td className="px-4 py-3">{d.tcNumber ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
