"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { createEnquirySource } from "@/features/settings/actions";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPES = ["FLYER", "PARENTS", "SIBLINGS", "SELF", "SOCIAL_MEDIA", "WEBSITE", "WORD_OF_MOUTH", "OTHER"];

export function CreateEnquirySourceForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<string>("OTHER");

  const defaultLabel = useMemo(() => type.replace(/_/g, " "), [type]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string)?.trim();
    try {
      await createEnquirySource({ name, type });
      toast.success("Enquiry source created");
      setOpen(false);
      setType("OTHER");
    } catch (err: any) {
      toast.error(err.message || "Failed to create enquiry source");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add Source
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Enquiry Source</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input name="name" required disabled={loading} placeholder="e.g. Facebook" />
          </div>
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select value={type} onValueChange={setType} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={defaultLabel} />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

