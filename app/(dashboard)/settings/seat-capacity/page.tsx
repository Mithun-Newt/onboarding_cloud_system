import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { UpsertSeatCapacityForm } from "./upsert-seat-capacity-form";

export const dynamic = "force-dynamic";

export default async function SeatCapacityPage() {
  const [years, campuses, grades, capacities] = await Promise.all([
    prisma.academicYear.findMany({ orderBy: { startYear: "desc" } }),
    prisma.campus.findMany({ orderBy: { name: "asc" } }),
    prisma.grade.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.gradeSeatCapacity.findMany({
      include: { academicYear: true, campus: true, grade: true },
      orderBy: [{ updatedAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Seat Capacity</h2>
        <UpsertSeatCapacityForm
          academicYears={years.map((y) => ({ id: y.id, label: y.label }))}
          campuses={campuses.map((c) => ({ id: c.id, name: c.name }))}
          grades={grades.map((g) => ({ id: g.id, name: g.name }))}
        />
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Academic Year</th>
              <th className="px-4 py-3 font-medium">Campus</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Total Seats</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {capacities.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{c.academicYear.label}</td>
                <td className="px-4 py-3">{c.campus.name}</td>
                <td className="px-4 py-3">{c.grade.name}</td>
                <td className="px-4 py-3">{c.totalSeats}</td>
                <td className="px-4 py-3">{formatDate(c.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

