"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { hardDeleteFullRecord } from "@/features/admissions/delete-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function HardDeleteButton({ registrationId, admissionId, redirectUrl }: { registrationId?: string; admissionId?: string; redirectUrl: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await hardDeleteFullRecord({ registrationId, admissionId });
      toast.success("Record Deleted", {
        description: "The entire record (registration, admission, documents) was permanently deleted.",
      });
      setOpen(false);
      router.push(redirectUrl);
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to delete record",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="destructive" className="ml-2 no-print" title="Hard Delete Record">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Permanent Deletion</DialogTitle>
          <DialogDescription>
            Are you absolutely sure? This will <strong>permanently destroy</strong> this record and everything linked to it (the linked registration/admission, uploaded documents, medical profiles, family links). This is designed for cleaning up test data and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, Delete Everything"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
