import { getPayments } from "@/features/payments/actions";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination-nav";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_BADGES: Record<string, { variant: any }> = {
  PAID: { variant: "success" },
  WAIVED: { variant: "secondary" },
  PENDING: { variant: "warning" },
  PARTIAL: { variant: "warning" },
  CANCELLED: { variant: "destructive" },
};

interface SearchParams {
  academicYearId?: string;
  page?: string;
}

export default async function PaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  const page = parseInt(searchParams.page ?? "1");

  const [result, academicYears] = await Promise.all([
    getPayments({ academicYearId: searchParams.academicYearId, page }),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
  ]);

  const totalCollected = result.items
    .filter((p) => p.paymentStatus === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Payments</h2>
          <p className="text-sm text-muted-foreground">{result.total} records · Showing collected: {formatCurrency(totalCollected)}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Receipt No</th>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Fee Type</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Mode</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Collected By</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((p) => {
              const s = STATUS_BADGES[p.paymentStatus] ?? { variant: "outline" };
              return (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-green-700">{p.receiptNo ?? "-"}</td>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admissions/${p.admissionId}`} className="text-blue-600 hover:underline">
                      {p.admission.student.fullNameEn}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.feeType}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(Number(p.amount))}</td>
                  <td className="px-4 py-3">{p.paymentMode}</td>
                  <td className="px-4 py-3">{p.paymentDate ? formatDate(p.paymentDate) : "-"}</td>
                  <td className="px-4 py-3">{p.collectedBy?.fullName ?? "-"}</td>
                  <td className="px-4 py-3"><Badge variant={s.variant}>{p.paymentStatus}</Badge></td>
                </tr>
              );
            })}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No payment records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination total={result.total} page={result.page} pageSize={result.pageSize} />
    </div>
  );
}
