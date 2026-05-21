"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { confirmAdmission } from "@/features/admissions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ConfirmAdmissionButton({ admissionId }: { admissionId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConfirm() {
    setLoading(true);
    try {
      const result = await confirmAdmission(admissionId);
      toast.success(`Admission confirmed: ${result.admissionNo}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Cannot confirm admission");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="mr-1 h-4 w-4" />Confirm Admission
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Admission?</AlertDialogTitle>
          <AlertDialogDescription>
            This will generate an admission number and mark the student as admitted. Ensure all required documents are verified and fees are collected or waived.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
