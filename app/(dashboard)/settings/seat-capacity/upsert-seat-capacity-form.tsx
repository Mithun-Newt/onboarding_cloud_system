"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { upsertSeatCapacity } from "@/features/settings/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  academicYears: { id: string; label: string }[];
  campuses: { id: string; name: string }[];
  grades: { id: string; name: string }[];
}

export function UpsertSeatCapacityForm({ academicYears, campuses, grades }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [academicYearId, setAcademicYearId] = useState<string>(academicYears[0]?.id ?? "");
  const [campusId, setCampusId] = useState<string>(campuses[0]?.id ?? "");
  const [gradeId, setGradeId] = useState<string>(grades[0]?.id ?? "");

  useEffect(() => {
    if (!academicYearId && academicYears[0]?.id) setAcademicYearId(academicYears[0].id);
    if (!campusId && campuses[0]?.id) setCampusId(campuses[0].id);
    if (!gradeId && grades[0]?.id) setGradeId(grades[0].id);
  }, [academicYearId, campusId, gradeId, academicYears, campuses, grades]);

  const disabled = loading || academicYears.length === 0 || campuses.length === 0 || grades.length === 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!academicYearId || !campusId || !gradeId) {
      toast.error("Please select academic year, campus, and grade");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const totalSeats = parseInt(fd.get("totalSeats") as string);
    try {
      await upsertSeatCapacity({
        academicYearId,
        campusId,
        gradeId,
        totalSeats: Number.isFinite(totalSeats) ? totalSeats : 0,
      });
      toast.success("Seat capacity saved");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save seat capacity");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <Plus className="mr-1 h-4 w-4" />
          Set Seats
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set Seat Capacity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Academic Year *</Label>
            <Select value={academicYearId} onValueChange={setAcademicYearId} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Campus *</Label>
            <Select value={campusId} onValueChange={setCampusId} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Select campus" />
              </SelectTrigger>
              <SelectContent>
                {campuses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Grade *</Label>
            <Select value={gradeId} onValueChange={setGradeId} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Total Seats *</Label>
            <Input name="totalSeats" type="number" min={0} required disabled={disabled} defaultValue={0} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={disabled}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

