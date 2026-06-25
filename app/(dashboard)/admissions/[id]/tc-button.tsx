"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, UserMinus } from "lucide-react";
import { issueTransferCertificate } from "@/features/admissions/tc-actions";
import { toast } from "sonner";

export function IssueTcButton({ admissionId }: { admissionId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleIssueTc = async () => {
    setLoading(true);
    try {
      await issueTransferCertificate(admissionId);
      toast.success("TC Issued", {
        description: "Transfer Certificate has been issued and documents pruned from cloud storage.",
      });
      setOpen(false);
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to issue TC",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive" className="ml-2">
          <UserMinus className="mr-1 h-4 w-4" /> Issue TC
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Transfer Certificate</DialogTitle>
          <DialogDescription>
            Are you absolutely sure? This will change the admission status to TC_ISSUED and <strong>permanently delete</strong> the student's physical documents (Aadhar, Birth Cert, etc.) from cloud storage to free up space. The student's text history will remain.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleIssueTc} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm & Delete Docs"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
