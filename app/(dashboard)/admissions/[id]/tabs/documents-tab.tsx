"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadDocument, updateDocumentStatus } from "@/features/documents/actions";
import { toast } from "sonner";
import { Upload, CheckCircle, XCircle, MinusCircle, Loader2 } from "lucide-react";

const STATUS_BADGES: Record<string, { label: string; variant: any }> = {
  NOT_RECEIVED: { label: "Not Received", variant: "outline" },
  UPLOADED: { label: "Uploaded", variant: "info" },
  VERIFIED: { label: "Verified", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  WAIVED: { label: "Waived", variant: "secondary" },
};

export function DocumentsTab({ admission }: { admission: any }) {
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
                  {doc.originalFilename && (
                    <p className="text-xs text-muted-foreground">{doc.originalFilename}</p>
                  )}
                  {doc.remarks && <p className="text-xs text-red-500">{doc.remarks}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {admission.status === "DRAFT" && (
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

          {admission.status === "DRAFT" && (
            <div className="pt-4 border-t">
              <UploadForm studentId={admission.studentId} onUpload={handleUpload} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UploadForm({ studentId, onUpload }: { studentId: string; onUpload: (dtId: string, f: File) => void }) {
  const [dtId, setDtId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !dtId) {
      toast.error("Select document type first");
      return;
    }
    setLoading(true);
    onUpload(dtId, file);
    setLoading(false);
    e.target.value = "";
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="text"
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        placeholder="Document type ID (from settings)"
        value={dtId}
        onChange={(e) => setDtId(e.target.value)}
      />
      <label className="cursor-pointer">
        <Button asChild size="sm" variant="outline" disabled={loading}>
          <span><Upload className="mr-1 h-4 w-4" />Upload</span>
        </Button>
        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleChange} />
      </label>
    </div>
  );
}
