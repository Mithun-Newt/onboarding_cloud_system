"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  total: number;
  page: number;
  pageSize: number;
}

export function Pagination({ total, page, pageSize }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  function navigate(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => navigate(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="flex items-center px-2">
          Page {page} of {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => navigate(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
