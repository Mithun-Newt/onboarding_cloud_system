"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cancelRegistration } from "@/features/registrations/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";

export function CancelRegistrationButton({ registrationId }: { registrationId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    if (!reason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    setLoading(true);
    try {
      await cancelRegistration(registrationId, reason);
      toast.success("Registration cancelled");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel");
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
        <DialogHeader><DialogTitle>Cancel Registration</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This will mark the registration as Cancelled. Please provide a reason.
          </p>
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
