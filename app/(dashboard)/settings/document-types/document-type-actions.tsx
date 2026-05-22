"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { updateDocumentType } from "@/features/settings/actions";
import { toast } from "sonner";

interface Props {
  documentType: { id: string; name: string; description: string; isRequired: boolean; isActive: boolean };
}

export function DocumentTypeActions({ documentType }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(documentType.name);
  const [description, setDescription] = useState(documentType.description);
  const [isRequired, setIsRequired] = useState(documentType.isRequired);
  const [isActive, setIsActive] = useState(documentType.isActive);

  useEffect(() => {
    if (!open) {
      setName(documentType.name);
      setDescription(documentType.description);
      setIsRequired(documentType.isRequired);
      setIsActive(documentType.isActive);
    }
  }, [open, documentType.description, documentType.isActive, documentType.isRequired, documentType.name]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDocumentType(documentType.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        isRequired,
        isActive,
      });
      toast.success("Document type updated");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update document type");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Document Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={isRequired} onCheckedChange={(v) => setIsRequired(Boolean(v))} disabled={loading} />
              Required
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} disabled={loading} />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

