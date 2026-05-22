import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CreateDocumentTypeForm } from "./create-document-type-form";
import { DocumentTypeActions } from "./document-type-actions";

export const dynamic = "force-dynamic";

export default async function DocumentTypesPage() {
  const types = await prisma.documentType.findMany({ orderBy: [{ createdAt: "desc" }] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Document Types</h2>
        <CreateDocumentTypeForm />
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Required</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{t.name}</div>
                  {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                </td>
                <td className="px-4 py-3">{t.isRequired ? <Badge variant="info">Required</Badge> : <Badge variant="secondary">Optional</Badge>}</td>
                <td className="px-4 py-3">{t.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}</td>
                <td className="px-4 py-3">{formatDate(t.createdAt)}</td>
                <td className="px-4 py-3">
                  <DocumentTypeActions
                    documentType={{
                      id: t.id,
                      name: t.name,
                      description: t.description ?? "",
                      isRequired: t.isRequired,
                      isActive: t.isActive,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

