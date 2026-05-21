import Link from "next/link";
import { getAdmissions } from "@/features/admissions/actions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Pagination } from "@/components/ui/pagination-nav";
import { AdmissionFilters } from "./admission-filters";

export const dynamic = "force-dynamic";

const STATUS_BADGES: Record<string, { label: string; variant: any }> = {
  DRAFT: { label: "Draft", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

interface SearchParams {
  academicYearId?: string;
  gradeId?: string;
  status?: string;
  search?: string;
  page?: string;
}

export default async function AdmissionsPage({ searchParams }: { searchParams: SearchParams }) {
  const page = parseInt(searchParams.page ?? "1");

  const [result, academicYears, grades] = await Promise.all([
    getAdmissions({
      academicYearId: searchParams.academicYearId,
      gradeId: searchParams.gradeId,
      status: searchParams.status,
      search: searchParams.search,
      page,
    }),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.grade.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Admissions</h2>
          <p className="text-sm text-muted-foreground">{result.total} total records</p>
        </div>
      </div>

      <AdmissionFilters academicYears={academicYears} grades={grades} />

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Admission No</th>
              <th className="px-4 py-3 font-medium">Student Name</th>
              <th className="px-4 py-3 font-medium">DOB</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Reg No</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((a) => {
              const status = STATUS_BADGES[a.status] ?? { label: a.status, variant: "outline" };
              return (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-green-700">
                    {a.admissionNo ?? <span className="text-muted-foreground italic">Pending</span>}
                  </td>
                  <td className="px-4 py-3 font-medium">{a.student.fullNameEn}</td>
                  <td className="px-4 py-3">{formatDate(a.student.dateOfBirth)}</td>
                  <td className="px-4 py-3">{a.grade.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{a.registration.registrationNo}</td>
                  <td className="px-4 py-3">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/admissions/${a.id}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No admissions yet. Start one from the{" "}
                  <Link href="/registrations" className="text-blue-600 underline">Registrations</Link> page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination total={result.total} page={result.page} pageSize={result.pageSize} />
    </div>
  );
}
