"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function StartAdmissionButton({
  registrationId,
  studentName,
  staffRemarks,
  hasVacancy = true,
}: {
  registrationId: string;
  studentName: string;
  staffRemarks?: string | null;
  hasVacancy?: boolean;
}) {
  const router = useRouter();
  const isEligible = staffRemarks?.toUpperCase() === "ELIGIBLE";
  const isDisabled = !isEligible || !hasVacancy;

  let tooltip = undefined;
  if (!isEligible) {
    tooltip = "Admission can only be started when Staff Remark is set to 'Eligible'";
  } else if (!hasVacancy) {
    tooltip = "No vacancy available for this class. Adjust dashboard targets first.";
  }

  return (
    <Button
      size="sm"
      disabled={isDisabled}
      title={tooltip}
      onClick={() => router.push(`/admissions/new?registrationId=${registrationId}`)}
    >
      <ArrowRight className="mr-1 h-4 w-4" />Start Admission
    </Button>
  );
}
