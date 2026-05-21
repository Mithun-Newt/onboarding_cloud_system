import Link from "next/link";
import { getPendingDocuments } from "@/features/documents/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const docs = await getPendingDocuments();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Documents</h2>
          <p className="text-sm text-muted-foreground">{docs.length} pending documents</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/documents/pending">View Pending</Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto text-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Document Type</th>
              <th className="px-4 py-3 font-medium">Required</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{d.student.fullNameEn}</td>
                <td className="px-4 py-3">{d.documentType.name}</td>
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
                    <Link href={`/admissions`}>View Admission</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No pending documents.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
