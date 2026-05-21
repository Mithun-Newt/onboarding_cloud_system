"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cancelAdmission } from "@/features/admissions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";

export function CancelAdmissionButton({ admissionId }: { admissionId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    if (!reason.trim()) { toast.error("Reason required"); return; }
    setLoading(true);
    try {
      await cancelAdmission(admissionId, reason);
      toast.success("Admission cancelled");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive"><XCircle className="mr-1 h-4 w-4" />Cancel</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Cancel Admission</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Provide a reason. The registration will revert to REGISTERED status.</p>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Back</Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
