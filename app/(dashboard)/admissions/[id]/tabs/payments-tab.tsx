"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { recordPayment } from "@/features/payments/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

const STATUS_BADGES: Record<string, { label: string; variant: any }> = {
  PENDING: { label: "Pending", variant: "warning" },
  PARTIAL: { label: "Partial", variant: "warning" },
  PAID: { label: "Paid", variant: "success" },
  WAIVED: { label: "Waived", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export function PaymentsTab({ admission }: { admission: any }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      feeType: "",
      amount: "",
      paymentMode: "CASH",
      paymentDate: new Date().toISOString().split("T")[0],
      remarks: "",
      waiverReason: "",
    },
  });

  const paymentMode = watch("paymentMode");

  const totalPaid = admission.payments
    .filter((p: any) => p.paymentStatus === "PAID" || p.paymentStatus === "WAIVED")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  async function onSubmit(data: any) {
    setLoading(true);
    try {
      await recordPayment(admission.id, {
        feeType: data.feeType,
        amount: parseFloat(data.amount),
        paymentMode: data.paymentMode,
        paymentDate: data.paymentDate,
        remarks: data.remarks,
        waiverReason: data.waiverReason,
      });
      toast.success("Payment recorded");
      reset();
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Fees & Payments</CardTitle>
        {admission.status === "DRAFT" && (
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" />{showForm ? "Cancel" : "Add Payment"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>

        {/* New payment form */}
        {showForm && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-lg border p-4">
            <h4 className="font-medium text-sm">Record Payment</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Fee Type *</Label>
                <Input {...register("feeType")} placeholder="e.g. Admission Fee" required />
              </div>
              <div className="space-y-1">
                <Label>Amount *</Label>
                <Input type="number" min="0" step="0.01" {...register("amount")} required />
              </div>
              <div className="space-y-1">
                <Label>Payment Mode *</Label>
                <Select value={paymentMode} onValueChange={(v) => setValue("paymentMode", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE", "WAIVER"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Payment Date</Label>
                <Input type="date" {...register("paymentDate")} />
              </div>
            </div>
            {paymentMode === "WAIVER" && (
              <div className="space-y-1">
                <Label>Waiver Reason *</Label>
                <Textarea {...register("waiverReason")} rows={2} required />
              </div>
            )}
            <div className="space-y-1">
              <Label>Remarks</Label>
              <Input {...register("remarks")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Record
              </Button>
            </div>
          </form>
        )}

        {/* Payment list */}
        <div className="divide-y">
          {admission.payments.map((p: any) => {
            const s = STATUS_BADGES[p.paymentStatus] ?? { label: p.paymentStatus, variant: "outline" };
            return (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{p.feeType}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.paymentMode} · {p.paymentDate ? formatDate(p.paymentDate) : "-"}
                    {p.collectedBy && ` · ${p.collectedBy.fullName}`}
                  </p>
                  {p.receiptNo && <p className="text-xs font-mono text-green-700">{p.receiptNo}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">{formatCurrency(Number(p.amount))}</p>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>
              </div>
            );
          })}
          {admission.payments.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground text-center">No payments recorded yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
