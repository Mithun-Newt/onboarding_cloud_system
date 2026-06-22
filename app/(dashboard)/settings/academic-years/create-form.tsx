"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { createAcademicYear } from "@/features/settings/actions";
import { toast } from "sonner";

export function CreateAcademicYearForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const startYear = parseInt(fd.get("startYear") as string);
    const endYear = startYear + 1;
    const label = `${startYear}-${String(endYear).slice(-2)}`;
    try {
      const res = await createAcademicYear({ label, startYear, endYear });
      if (!res.success) throw new Error(res.error);
      toast.success(`Academic year ${label} created`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create academic year");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1 h-4 w-4" />New Year</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Academic Year</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Start Year</Label>
            <Input name="startYear" type="number" min={2020} max={2050} required placeholder="e.g. 2027" />
            <p className="text-xs text-muted-foreground">End year is set automatically (start + 1).</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
