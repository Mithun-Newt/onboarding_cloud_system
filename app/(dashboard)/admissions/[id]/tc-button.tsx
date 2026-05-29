"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { issueTC } from "@/features/admissions/tc-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export function IssueTCButton({ admission }: { admission: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form states
  const [tcNumber, setTcNumber] = useState("");
  const [tcDate, setTcDate] = useState(new Date().toISOString().split("T")[0]);
  const [destinationSchool, setDestinationSchool] = useState("");
  const [reason, setReason] = useState("");

  async function handleIssue() {
    if (!tcNumber.trim()) { toast.error("TC Number is required"); return; }
    if (!tcDate) { toast.error("Date of Issue is required"); return; }
    if (!destinationSchool.trim()) { toast.error("Destination school is required"); return; }
    if (!reason.trim()) { toast.error("Reason is required"); return; }

    setLoading(true);
    try {
      await issueTC(admission.id, {
        tcNumber,
        tcDate,
        destinationSchool,
        reason,
      });
      toast.success("Transfer Certificate (TC) issued successfully");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to issue TC");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
          <LogOut className="mr-1 h-4 w-4" /> Issue TC
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Transfer Certificate (TC)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/40 p-2.5 rounded text-xs space-y-1">
            <p><strong>Student:</strong> {admission.student.fullNameEn}</p>
            <p><strong>Admission No:</strong> {admission.admissionNo || "N/A"}</p>
            <p><strong>Grade / Class:</strong> {admission.grade.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">TC Number *</Label>
              <Input 
                value={tcNumber} 
                onChange={(e) => setTcNumber(e.target.value)} 
                placeholder="e.g. TC/2026/001" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Date of Issue *</Label>
              <Input 
                type="date" 
                value={tcDate} 
                onChange={(e) => setTcDate(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">School Moving To *</Label>
            <Input 
              value={destinationSchool} 
              onChange={(e) => setDestinationSchool(e.target.value)} 
              placeholder="e.g. St. Mary's Primary School" 
              required 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Reason for Leaving *</Label>
            <Textarea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              placeholder="e.g. Relocating to another city, course completed" 
              rows={3} 
              required 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleIssue} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Issue TC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
