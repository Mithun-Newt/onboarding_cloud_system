import Link from "next/link";
import { getAdmissions } from "@/features/admissions/actions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Bus } from "lucide-react";
import { Pagination } from "@/components/ui/pagination-nav";
import { AdmissionFilters } from "./admission-filters";
import { getSession } from "@/lib/auth";
import { TransportFilters } from "./transport-filters";

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
  routeId?: string;
}

export default async function AdmissionsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  const roles = (session?.user as any)?.roles || [];
  const isTransportStaff = roles.includes("TRANSPORT_STAFF");

  if (isTransportStaff) {
    const [transportStudents, routes] = await Promise.all([
      prisma.transportRequest.findMany({
        where: {
          required: true,
          admission: {
            status: "CONFIRMED",
          },
        },
        include: {
          admission: {
            include: {
              student: true,
              grade: true,
              campus: true,
            },
          },
          route: true,
          stop: true,
        },
        orderBy: {
          admission: {
            student: {
              fullNameEn: "asc",
            },
          },
        },
      }),
      prisma.busRoute.findMany({ where: { isActive: true }, orderBy: { routeNo: "asc" } }),
    ]);

    // Apply in-memory filters
    const search = searchParams.search?.toLowerCase() || "";
    const routeId = searchParams.routeId || "";

    const filteredTransport = transportStudents.filter((t) => {
      if (search && !t.admission.student.fullNameEn.toLowerCase().includes(search)) {
        return false;
      }
      if (routeId && t.routeId !== routeId) {
        return false;
      }
      return true;
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bus className="h-6 w-6 text-primary" />
              Transport Coordinator View
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredTransport.length} student(s) confirmed for bus transport
            </p>
          </div>
        </div>

        <TransportFilters routes={routes} />

        <div className="rounded-lg border bg-white overflow-x-auto text-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Student Name</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Campus</th>
                <th className="px-4 py-3 font-medium">Bus Route</th>
                <th className="px-4 py-3 font-medium">Bus Stop</th>
                <th className="px-4 py-3 font-medium">Timings (Pickup / Drop)</th>
                <th className="px-4 py-3 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransport.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{t.admission.student.fullNameEn}</td>
                  <td className="px-4 py-3">{t.admission.grade.name}</td>
                  <td className="px-4 py-3">{t.admission.campus.name}</td>
                  <td className="px-4 py-3 font-medium text-blue-700">
                    {t.route ? `${t.route.routeNo} - ${t.route.name}` : "-"}
                  </td>
                  <td className="px-4 py-3">{t.stop?.stopName || "-"}</td>
                  <td className="px-4 py-3 text-xs">
                    {t.stop ? `${t.stop.pickupTime} / ${t.stop.dropTime}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground italic text-xs">
                    {t.remarks || "-"}
                  </td>
                </tr>
              ))}
              {filteredTransport.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No matching student transport records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback to standard admissions manager view
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
              const hasPendingDocs = (a.student as any).documents && (a.student as any).documents.length > 0;
              const badgeVariant = a.status === "CONFIRMED" && hasPendingDocs ? "brown" : status.variant;
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
                    <Badge variant={badgeVariant}>{status.label}</Badge>
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
