"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { updateGrade } from "@/features/settings/actions";
import { toast } from "sonner";

interface Props {
  grade: { id: string; name: string; sortOrder: number; isActive: boolean };
}

export function GradeActions({ grade }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(grade.name);
  const [sortOrder, setSortOrder] = useState<number>(grade.sortOrder);
  const [isActive, setIsActive] = useState<boolean>(grade.isActive);

  useEffect(() => {
    if (!open) {
      setName(grade.name);
      setSortOrder(grade.sortOrder);
      setIsActive(grade.isActive);
    }
  }, [open, grade.isActive, grade.name, grade.sortOrder]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateGrade(grade.id, { name: name.trim(), sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0, isActive });
      toast.success("Grade updated");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update grade");
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
          <DialogTitle>Edit Grade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Sort Order *</Label>
            <Input
              value={Number.isFinite(sortOrder) ? sortOrder : 0}
              onChange={(e) => setSortOrder(parseInt(e.target.value))}
              type="number"
              required
              disabled={loading}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} disabled={loading} />
            Active
          </label>
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

