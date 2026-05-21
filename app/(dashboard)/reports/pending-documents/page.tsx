import { pendingDocumentsReport } from "@/features/reports/queries";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ReportLayout } from "@/components/reports/report-layout";
import { ReportFilters } from "@/components/reports/report-filters";

export const dynamic = "force-dynamic";

export default async function PendingDocumentsPage({ searchParams }: { searchParams: { academicYearId?: string } }) {
  const [data, academicYears] = await Promise.all([
    pendingDocumentsReport(searchParams),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
  ]);

  const csvData = data.map((d) => ({
    Student: d.student.fullNameEn,
    "Document Type": d.documentType.name,
    Required: d.documentType.isRequired ? "Yes" : "No",
    Status: d.status,
  }));

  return (
    <ReportLayout title="Pending Documents" csvData={csvData} csvFilename="pending-documents.csv">
      <ReportFilters academicYears={academicYears} />
      <div className="rounded-lg border bg-white overflow-x-auto text-sm">
        <div className="px-4 py-2 border-b text-xs text-muted-foreground">{data.length} pending documents</div>
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Document Type</th>
              <th className="px-4 py-3 font-medium">Required</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{d.student.fullNameEn}</td>
                <td className="px-4 py-3">{d.documentType.name}</td>
                <td className="px-4 py-3">{d.documentType.isRequired ? <Badge variant="destructive">Required</Badge> : <Badge variant="outline">Optional</Badge>}</td>
                <td className="px-4 py-3"><Badge variant={d.status === "UPLOADED" ? "info" : "warning"}>{d.status.replace("_", " ")}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
