import { seatAvailabilityReport } from "@/features/reports/queries";
import { prisma } from "@/lib/prisma";
import { ReportLayout } from "@/components/reports/report-layout";
import { ReportFilters } from "@/components/reports/report-filters";

export const dynamic = "force-dynamic";

export default async function SeatAvailabilityPage({ searchParams }: { searchParams: { academicYearId?: string } }) {
  const [data, academicYears, campuses] = await Promise.all([
    seatAvailabilityReport(searchParams),
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.campus.findMany(),
  ]);

  const csvData = data.map((r) => ({
    Grade: r.grade,
    Campus: r.campus,
    "Academic Year": r.year,
    "Total Seats": r.totalSeats,
    "Admitted": r.admitted,
    "Available": r.available,
    "Fill %": r.totalSeats > 0 ? `${Math.round((r.admitted / r.totalSeats) * 100)}%` : "0%",
  }));

  return (
    <ReportLayout title="Seat Availability" csvData={csvData} csvFilename="seat-availability.csv">
      <ReportFilters academicYears={academicYears} campuses={campuses} />
      <div className="rounded-lg border bg-white overflow-x-auto text-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Campus</th>
              <th className="px-4 py-3 font-medium">Year</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">Admitted</th>
              <th className="px-4 py-3 font-medium text-right">Available</th>
              <th className="px-4 py-3 font-medium">Fill %</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => {
              const pct = r.totalSeats > 0 ? (r.admitted / r.totalSeats) * 100 : 0;
              return (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{r.grade}</td>
                  <td className="px-4 py-3">{r.campus}</td>
                  <td className="px-4 py-3">{r.year}</td>
                  <td className="px-4 py-3 text-right">{r.totalSeats}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">{r.admitted}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{r.available}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <span className="text-xs">{Math.round(pct)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
