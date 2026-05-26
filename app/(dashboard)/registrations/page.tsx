import Link from "next/link";
import { getRegistrations } from "@/features/registrations/actions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil, FileText } from "lucide-react";
import { RegistrationFilters } from "./registration-filters";
import { Pagination } from "@/components/ui/pagination-nav";
import { getSession } from "@/lib/auth";

const STATUS_BADGES: Record<string, { label: string; variant: any }> = {
  REGISTERED: { label: "Registered", variant: "info" },
  ADMISSION_STARTED: { label: "Admission Started", variant: "warning" },
  ADMITTED: { label: "Admitted", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export const dynamic = "force-dynamic";

interface SearchParams {
  academicYearId?: string;
  gradeId?: string;
  status?: string;
  search?: string;
  page?: string;
  hasPriority?: string;
}

export default async function RegistrationsPage({ searchParams }: { searchParams: SearchParams }) {
  const page = parseInt(searchParams.page ?? "1");

  const [session, result, academicYears, grades] = await Promise.all([
    getSession(),
    getRegistrations({
      academicYearId: searchParams.academicYearId,
      gradeId: searchParams.gradeId,
      status: searchParams.status,
      search: searchParams.search,
      hasPriority: searchParams.hasPriority,
      page,
    }),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.grade.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const roles = (session?.user as any)?.roles || [];
  const isWriteAllowed = roles.includes("SYSTEM_ADMIN") || roles.includes("TIC") || roles.includes("ADMISSION_STAFF");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Registrations</h2>
          <p className="text-sm text-muted-foreground">{result.total} total records</p>
        </div>
        {isWriteAllowed && (
          <Button asChild>
            <Link href="/registrations/new"><Plus className="mr-1 h-4 w-4" />New Registration</Link>
          </Button>
        )}
      </div>

      <RegistrationFilters academicYears={academicYears} grades={grades} />

      <div className="rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Reg No</th>
                <th className="px-4 py-3 font-medium">Student Name</th>
                <th className="px-4 py-3 font-medium">DOB</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((r) => {
                const status = STATUS_BADGES[r.status] ?? { label: r.status, variant: "outline" };
                return (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700">{r.registrationNo}</td>
                    <td className="px-4 py-3 font-medium flex items-center gap-1.5">
                      <span>{r.studentName}</span>
                      {r.referredStudentType === "SIBLING" && (
                        <Badge variant="success" className="text-[10px] font-semibold px-1.5 py-0 shrink-0">Sibling</Badge>
                      )}
                      {r.referredStudentType === "RELATIVE" && (
                        <Badge variant="warning" className="text-[10px] font-semibold px-1.5 py-0 shrink-0">Relative</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatDate(r.dateOfBirth)}</td>
                    <td className="px-4 py-3">{r.grade.name}</td>
                    <td className="px-4 py-3">{r.fatherMobile || r.motherMobile || r.primaryContact || "-"}</td>
                    <td className="px-4 py-3">{formatDate(r.registrationDate)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/registrations/${r.id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        {r.status === "REGISTERED" && isWriteAllowed && (
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/registrations/${r.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/registrations/${r.id}/print`}><FileText className="h-4 w-4" /></Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {result.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No registrations found. <Link href="/registrations/new" className="text-blue-600 underline">Create one.</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination total={result.total} page={result.page} pageSize={result.pageSize} />
    </div>
  );
}
