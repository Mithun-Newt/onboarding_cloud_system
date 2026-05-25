"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useCallback } from "react";

interface Props {
  routes: { id: string; routeNo: string; name: string }[];
}

export function TransportFilters({ routes }: Props) {
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

  const hasFilters = searchParams.get("search") || searchParams.get("routeId");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9 w-56"
          placeholder="Search student name…"
          defaultValue={searchParams.get("search") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") set("search", (e.target as HTMLInputElement).value || null);
          }}
        />
      </div>

      <Select value={searchParams.get("routeId") ?? "__all__"} onValueChange={(v) => set("routeId", v)}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="All bus routes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All bus routes</SelectItem>
          {routes.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.routeNo} - {r.name}
            </SelectItem>
          ))}
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
