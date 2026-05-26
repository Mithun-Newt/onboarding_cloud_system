"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useCallback } from "react";
import { AcademicYear, Grade } from "@prisma/client";

interface Props {
  academicYears: AcademicYear[];
  grades: Grade[];
}

const STATUSES = [
  { value: "REGISTERED", label: "Registered" },
  { value: "ADMISSION_STARTED", label: "Admission Started" },
  { value: "ADMITTED", label: "Admitted" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function RegistrationFilters({ academicYears, grades }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const set = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "__all__") params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const hasFilters =
    searchParams.get("search") ||
    searchParams.get("academicYearId") ||
    searchParams.get("gradeId") ||
    searchParams.get("status") ||
    searchParams.get("hasPriority");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9 w-56"
          placeholder="Search name, reg no, mobile…"
          defaultValue={searchParams.get("search") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") set("search", (e.target as HTMLInputElement).value || null);
          }}
        />
      </div>

      <Select value={searchParams.get("academicYearId") ?? "__all__"} onValueChange={(v) => set("academicYearId", v)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All years" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All years</SelectItem>
          {academicYears.map((y) => (
            <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("gradeId") ?? "__all__"} onValueChange={(v) => set("gradeId", v)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="All grades" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All grades</SelectItem>
          {grades.map((g) => (
            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("status") ?? "__all__"} onValueChange={(v) => set("status", v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("hasPriority") ?? "__all__"} onValueChange={(v) => set("hasPriority", v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All admissions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All admissions</SelectItem>
          <SelectItem value="true">Priority Only</SelectItem>
          <SelectItem value="false">Normal Only</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X className="mr-1 h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
}
