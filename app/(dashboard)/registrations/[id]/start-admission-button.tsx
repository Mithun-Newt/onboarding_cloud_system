"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function StartAdmissionButton({ registrationId, studentName }: { registrationId: string; studentName: string }) {
  const router = useRouter();

  return (
    <Button
      size="sm"
      onClick={() => router.push(`/admissions/new?registrationId=${registrationId}`)}
    >
      <ArrowRight className="mr-1 h-4 w-4" />Start Admission
    </Button>
  );
}
