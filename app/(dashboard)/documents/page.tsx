import Link from "next/link";
import { getPendingDocuments } from "@/features/documents/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { DocumentFilters } from "./document-filters";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  gradeId?: string;
  status?: string;
}

export default async function DocumentsPage({ searchParams }: { searchParams: SearchParams }) {
  const [docs, grades] = await Promise.all([
    getPendingDocuments(),
    prisma.grade.findMany({ orderBy: { sortOrder: "asc" } })
  ]);

  const getGradeInfo = (d: any) => {
    const grade = d.student.admissions[0]?.grade || d.student.registrations[0]?.grade;
    return {
      id: grade?.id || "",
      name: grade?.name || "-",
      sortOrder: grade?.sortOrder ?? 999
    };
  };

  // Sort by grade's sortOrder
  docs.sort((a, b) => getGradeInfo(a).sortOrder - getGradeInfo(b).sortOrder);

  // Filter in-memory based on query parameters
  const searchQuery = searchParams.search?.toLowerCase() || "";
  const selectedGradeId = searchParams.gradeId || "";
  const selectedStatus = searchParams.status || "";

  const filteredDocs = docs.filter((d) => {
    const info = getGradeInfo(d);

    if (searchQuery && !d.student.fullNameEn.toLowerCase().includes(searchQuery)) {
      return false;
    }

    if (selectedGradeId && info.id !== selectedGradeId) {
      return false;
    }

    if (selectedStatus && d.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Documents</h2>
          <p className="text-sm text-muted-foreground">{filteredDocs.length} pending documents</p>
        </div>
      </div>

      <DocumentFilters grades={grades} />

      <div className="rounded-lg border bg-white overflow-x-auto text-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Document Type</th>
              <th className="px-4 py-3 font-medium">Required</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((d) => {
              const gradeName = getGradeInfo(d).name;
              return (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{d.student.fullNameEn}</td>
                  <td className="px-4 py-3">{gradeName}</td>
                  <td className="px-4 py-3">
                    {d.status === "UPLOADED" ? (
                      <a
                        href={`/api/documents/${d.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-600 hover:underline hover:text-blue-800"
                      >
                        {d.documentType.name}
                      </a>
                    ) : (
                      <span>{d.documentType.name}</span>
                    )}
                    {d.originalFilename && d.status === "UPLOADED" && (
                      <p className="text-xs text-muted-foreground mt-0.5">{d.originalFilename}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {d.documentType.isRequired
                      ? <Badge variant="destructive">Required</Badge>
                      : <Badge variant="outline">Optional</Badge>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={d.status === "UPLOADED" ? "info" : "warning"}>
                      {d.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" asChild>
                      {d.student.admissions[0] ? (
                        <Link href={`/admissions/${d.student.admissions[0].id}`}>View Admission</Link>
                      ) : (
                        <Link href={`/registrations`}>View Registrations</Link>
                      )}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filteredDocs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No pending documents found matching the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
