import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { GradeActions } from "./grade-actions";

export const dynamic = "force-dynamic";

export default async function GradesPage() {
  const grades = await prisma.grade.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Grades / Classes</h2>
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Sort Order</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{g.name}</td>
                <td className="px-4 py-3">{g.sortOrder}</td>
                <td className="px-4 py-3">{g.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}</td>
                <td className="px-4 py-3">{formatDate(g.createdAt)}</td>
                <td className="px-4 py-3">
                  <GradeActions grade={{ id: g.id, name: g.name, sortOrder: g.sortOrder, isActive: g.isActive }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

