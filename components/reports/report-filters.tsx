"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCallback } from "react";
import type { AcademicYear, Grade, Campus } from "@prisma/client";

interface Props {
  academicYears?: AcademicYear[];
  grades?: Grade[];
  campuses?: Campus[];
  showDateRange?: boolean;
}

export function ReportFilters({ academicYears, grades, campuses, showDateRange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const set = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "__all__") params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-gray-50 p-4 no-print">
      {academicYears && (
        <div className="space-y-1">
          <Label className="text-xs">Academic Year</Label>
          <Select value={searchParams.get("academicYearId") ?? "__all__"} onValueChange={(v) => set("academicYearId", v)}>
            <SelectTrigger className="w-32 h-8"><SelectValue placeholder="All years" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {academicYears.map((y) => <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {grades && (
        <div className="space-y-1">
          <Label className="text-xs">Grade</Label>
          <Select value={searchParams.get("gradeId") ?? "__all__"} onValueChange={(v) => set("gradeId", v)}>
            <SelectTrigger className="w-28 h-8"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {campuses && (
        <div className="space-y-1">
          <Label className="text-xs">Campus</Label>
          <Select value={searchParams.get("campusId") ?? "__all__"} onValueChange={(v) => set("campusId", v)}>
            <SelectTrigger className="w-32 h-8"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {campuses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {showDateRange && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" className="h-8 w-36" defaultValue={searchParams.get("startDate") ?? ""} onBlur={(e) => set("startDate", e.target.value || null)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" className="h-8 w-36" defaultValue={searchParams.get("endDate") ?? ""} onBlur={(e) => set("endDate", e.target.value || null)} />
          </div>
        </>
      )}
    </div>
  );
}
