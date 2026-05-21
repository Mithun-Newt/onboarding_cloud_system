import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AcademicYearActions } from "./academic-year-actions";
import { CreateAcademicYearForm } from "./create-form";

export const dynamic = "force-dynamic";

export default async function AcademicYearsPage() {
  const years = await prisma.academicYear.findMany({ orderBy: { startYear: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Academic Years</h2>
        <CreateAcademicYearForm />
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Start Year</th>
              <th className="px-4 py-3 font-medium">End Year</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {years.map((y) => (
              <tr key={y.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{y.label}</td>
                <td className="px-4 py-3">{y.startYear}</td>
                <td className="px-4 py-3">{y.endYear}</td>
                <td className="px-4 py-3">
                  {y.isCurrent && <Badge variant="success">Current</Badge>}
                  {!y.isCurrent && y.isActive && <Badge variant="secondary">Active</Badge>}
                  {!y.isActive && !y.isCurrent && <Badge variant="outline">Inactive</Badge>}
                </td>
                <td className="px-4 py-3">{formatDate(y.createdAt)}</td>
                <td className="px-4 py-3">
                  <AcademicYearActions year={y} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
