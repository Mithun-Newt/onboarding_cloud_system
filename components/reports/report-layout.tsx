"use client";

import { Button } from "@/components/ui/button";
import { Download, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  title: string;
  children: React.ReactNode;
  csvData?: object[];
  csvFilename?: string;
}

function toCsv(data: object[]): string {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = (row as any)[h];
      if (val === null || val === undefined) return "";
      const str = String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function ReportLayout({ title, children, csvData, csvFilename }: Props) {
  function downloadCsv() {
    if (!csvData) return;
    const csv = toCsv(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFilename ?? "report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 no-print">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/reports"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h2 className="text-xl font-bold flex-1">{title}</h2>
        <div className="flex gap-2">
          {csvData && (
            <Button variant="outline" size="sm" onClick={downloadCsv}>
              <Download className="mr-1 h-4 w-4" />CSV
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" />Print
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
