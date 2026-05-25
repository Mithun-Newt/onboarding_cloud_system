"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadDocument, updateDocumentStatus } from "@/features/documents/actions";
import { toast } from "sonner";
import { Upload, CheckCircle, XCircle, MinusCircle, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRestrictionForDocumentType, DEFAULT_RESTRICTION } from "@/lib/document-restrictions";
import { useSession } from "next-auth/react";

const STATUS_BADGES: Record<string, { label: string; variant: any }> = {
  NOT_RECEIVED: { label: "Not Received", variant: "outline" },
  UPLOADED: { label: "Uploaded", variant: "info" },
  VERIFIED: { label: "Verified", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  WAIVED: { label: "Waived", variant: "secondary" },
};

export function DocumentsTab({ admission, documentTypes }: { admission: any; documentTypes: { id: string; name: string }[] }) {
  const { data: session } = useSession();
  const roles = (session?.user as any)?.roles || [];
  const isSysAdminOrTic = roles.includes("SYSTEM_ADMIN") || roles.includes("TIC");
  const isWriteAllowed = isSysAdminOrTic || roles.includes("ADMISSION_STAFF");

  const documents = admission.student.documents;
  const [isPending, startTransition] = useTransition();

  function handleUpload(documentTypeId: string, file: File) {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("studentId", admission.studentId);
    fd.set("documentTypeId", documentTypeId);

    startTransition(async () => {
      try {
        await uploadDocument(fd);
        toast.success("Document uploaded");
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
      }
    });
  }

  function handleStatus(documentId: string, status: string) {
    const remarks = status === "REJECTED" ? prompt("Rejection reason:") : undefined;
    if (status === "REJECTED" && !remarks) return;
    const waiverReason = status === "WAIVED" ? prompt("Waiver reason:") : undefined;
    if (status === "WAIVED" && !waiverReason) return;

    startTransition(async () => {
      try {
        await updateDocumentStatus(documentId, status as any, remarks ?? undefined, waiverReason ?? undefined);
        toast.success("Status updated");
      } catch (err: any) {
        toast.error(err.message || "Failed");
      }
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.length === 0 && (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          )}
          {documents.map((doc: any) => {
            const status = STATUS_BADGES[doc.status] ?? { label: doc.status, variant: "outline" };
            return (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{doc.documentType.name}</p>
                  {doc.originalFilename && doc.filePath ? (
                    <a
                      href={`/api/documents/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline hover:text-blue-800 inline-block mt-0.5"
                    >
                      {doc.originalFilename}
                    </a>
                  ) : doc.originalFilename ? (
                    <p className="text-xs text-muted-foreground">{doc.originalFilename}</p>
                  ) : null}
                  {doc.remarks && <p className="text-xs text-red-500">{doc.remarks}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {admission.status === "DRAFT" && isWriteAllowed && (
                    <div className="flex gap-1">
                      {doc.status === "UPLOADED" && (
                        <>
                          <Button size="sm" variant="ghost" title="Verify" onClick={() => handleStatus(doc.id, "VERIFIED")}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Reject" onClick={() => handleStatus(doc.id, "REJECTED")}>
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      {doc.status === "NOT_RECEIVED" && (
                        <Button size="sm" variant="ghost" title="Waive" onClick={() => handleStatus(doc.id, "WAIVED")}>
                          <MinusCircle className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {admission.status === "DRAFT" && isWriteAllowed && (
            <div className="pt-4 border-t">
              <UploadForm studentId={admission.studentId} documentTypes={documentTypes} onUpload={handleUpload} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UploadForm({
  studentId,
  documentTypes,
  onUpload,
}: {
  studentId: string;
  documentTypes: { id: string; name: string }[];
  onUpload: (dtId: string, f: File) => void;
}) {
  const [dtId, setDtId] = useState<string>(documentTypes[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  const selectedDt = documentTypes.find((dt) => dt.id === dtId);
  const restriction = selectedDt ? getRestrictionForDocumentType(selectedDt.name) : DEFAULT_RESTRICTION;

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !dtId) {
      toast.error("Select document type first");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !restriction.allowedExtensions.includes(`.${ext}`)) {
      toast.error(`Invalid file type. ${restriction.description}`);
      return;
    }

    setLoading(true);
    onUpload(dtId, file);
    setLoading(false);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Select value={dtId} onValueChange={setDtId} disabled={loading || documentTypes.length === 0}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={documentTypes.length === 0 ? "No document types (add in settings)" : "Select document type"} />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((dt) => (
              <SelectItem key={dt.id} value={dt.id}>
                {dt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="cursor-pointer">
          <Button asChild size="sm" variant="outline" disabled={loading || documentTypes.length === 0}>
            <span><Upload className="mr-1 h-4 w-4" />Upload</span>
          </Button>
          <input type="file" className="hidden" accept={restriction.allowedExtensions.join(",")} onChange={handleChange} />
        </label>
      </div>
      {selectedDt && (
        <p className="text-xs text-muted-foreground pl-1">{restriction.description}</p>
      )}
    </div>
  );
}
