"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createAdmission } from "@/features/admissions/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function NewAdmissionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registrationId = searchParams.get("registrationId");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!registrationId) {
      setError("No registration ID provided. Please start admission from a Registration record.");
      return;
    }

    createAdmission(registrationId)
      .then((admission) => {
        toast.success("Admission started");
        router.replace(`/admissions/${admission.id}`);
      })
      .catch((err) => {
        setError(err.message || "Failed to create admission");
      });
  }, [registrationId, router]);

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-red-600 font-medium mb-2">Error</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Creating admission record…
      </div>
    </div>
  );
}

export default function NewAdmissionPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      </div>
    }>
      <NewAdmissionInner />
    </Suspense>
  );
}
