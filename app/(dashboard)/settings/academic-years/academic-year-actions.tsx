"use client";

import { Button } from "@/components/ui/button";
import { setCurrentAcademicYear } from "@/features/settings/actions";
import { toast } from "sonner";
import { AcademicYear } from "@prisma/client";

export function AcademicYearActions({ year }: { year: AcademicYear }) {
  async function handleSetCurrent() {
    try {
      await setCurrentAcademicYear(year.id);
      toast.success(`${year.label} is now the current year`);
    } catch {
      toast.error("Failed to update");
    }
  }

  return (
    <div className="flex gap-2">
      {!year.isCurrent && (
        <Button size="sm" variant="outline" onClick={handleSetCurrent}>
          Set Current
        </Button>
      )}
    </div>
  );
}
