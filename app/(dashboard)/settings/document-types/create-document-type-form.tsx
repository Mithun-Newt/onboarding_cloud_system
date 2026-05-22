"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { createDocumentType } from "@/features/settings/actions";
import { toast } from "sonner";

export function CreateDocumentTypeForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRequired, setIsRequired] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string)?.trim();
    const description = (fd.get("description") as string)?.trim();
    try {
      await createDocumentType({ name, description: description || undefined, isRequired });
      toast.success("Document type created");
      setOpen(false);
      setIsRequired(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create document type");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add Type
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Document Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input name="name" required disabled={loading} placeholder="e.g. Birth Certificate" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea name="description" disabled={loading} placeholder="Optional" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={isRequired} onCheckedChange={(v) => setIsRequired(Boolean(v))} disabled={loading} />
            Required
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

