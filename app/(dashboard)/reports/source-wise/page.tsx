import { sourceWiseReport } from "@/features/reports/queries";
import { prisma } from "@/lib/prisma";
import { ReportLayout } from "@/components/reports/report-layout";
import { ReportFilters } from "@/components/reports/report-filters";

export const dynamic = "force-dynamic";

export default async function SourceWisePage({ searchParams }: { searchParams: { academicYearId?: string } }) {
  const [data, academicYears] = await Promise.all([
    sourceWiseReport(searchParams),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
  ]);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <ReportLayout title="Source-wise Enquiries" csvData={data.map((d) => ({ Source: d.source, Count: d.count }))} csvFilename="source-wise.csv">
      <ReportFilters academicYears={academicYears} />
      <div className="flex flex-wrap gap-4">
        {data.sort((a, b) => b.count - a.count).map((d) => (
          <div key={d.source} className="rounded-lg border bg-white p-6 text-center min-w-[140px]">
            <p className="text-3xl font-bold text-blue-600">{d.count}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d.source}</p>
            <p className="text-xs text-gray-400">{total > 0 ? Math.round((d.count / total) * 100) : 0}%</p>
          </div>
        ))}
        {data.length === 0 && <p className="text-muted-foreground text-sm">No data available.</p>}
      </div>
    </ReportLayout>
  );
}
