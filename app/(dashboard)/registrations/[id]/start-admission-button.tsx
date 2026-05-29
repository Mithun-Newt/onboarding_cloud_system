"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function StartAdmissionButton({
  registrationId,
  studentName,
  staffRemarks,
}: {
  registrationId: string;
  studentName: string;
  staffRemarks?: string | null;
}) {
  const router = useRouter();
  const isEligible = staffRemarks === "ELIGIBLE";

  return (
    <Button
      size="sm"
      disabled={!isEligible}
      title={!isEligible ? "Admission can only be started when Staff Remark is set to 'Eligible'" : undefined}
      onClick={() => router.push(`/admissions/new?registrationId=${registrationId}`)}
    >
      <ArrowRight className="mr-1 h-4 w-4" />Start Admission
    </Button>
  );
}
