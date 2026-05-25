"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { recordPayment, collectPayment, deletePendingPayment } from "@/features/payments/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Check, X, Wallet, Info } from "lucide-react";

const STATUS_BADGES: Record<string, { label: string; variant: any }> = {
  PENDING: { label: "Pending", variant: "warning" },
  PARTIAL: { label: "Partial", variant: "warning" },
  PAID: { label: "Paid", variant: "success" },
  WAIVED: { label: "Waived", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

import { useSession } from "next-auth/react";

export function PaymentsTab({ admission }: { admission: any }) {
  const { data: session } = useSession();
  const roles = (session?.user as any)?.roles || [];
  const isSysAdminOrTic = roles.includes("SYSTEM_ADMIN") || roles.includes("TIC");
  const isWriteAllowed = isSysAdminOrTic || roles.includes("ADMISSION_STAFF") || roles.includes("CASHIER");

  const [showAddForm, setShowAddForm] = useState(false);
  const [collectingPayment, setCollectingPayment] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Form for adding a pending payment
  const addForm = useForm({
    defaultValues: {
      feeType: "",
      amount: "",
      remarks: "",
    },
  });

  // Form for collecting an existing payment
  const collectForm = useForm({
    defaultValues: {
      paymentMode: "CASH",
      paymentDate: new Date().toISOString().split("T")[0],
      remarks: "",
      waiverReason: "",
    },
  });

  const paymentMode = collectForm.watch("paymentMode");

  const totalPaid = admission.payments
    .filter((p: any) => p.paymentStatus === "PAID" || p.paymentStatus === "WAIVED")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const totalPending = admission.payments
    .filter((p: any) => p.paymentStatus === "PENDING" || p.paymentStatus === "PARTIAL")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  // Handles adding a new PENDING payment
  async function onAddSubmit(data: any) {
    setLoading(true);
    try {
      await recordPayment(admission.id, {
        feeType: data.feeType,
        amount: parseFloat(data.amount),
        remarks: data.remarks,
      });
      toast.success("Pending fee item added");
      addForm.reset();
      setShowAddForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add pending payment");
    } finally {
      setLoading(false);
    }
  }

  // Handles collecting/paying an existing payment
  async function onCollectSubmit(data: any) {
    if (!collectingPayment) return;
    setLoading(true);
    try {
      await collectPayment(collectingPayment.id, {
        paymentMode: data.paymentMode,
        paymentDate: data.paymentDate,
        remarks: data.remarks,
        waiverReason: data.waiverReason,
      });
      toast.success("Payment recorded successfully");
      collectForm.reset();
      setCollectingPayment(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  }

  // Handles deleting a PENDING payment
  async function handleDelete(paymentId: string) {
    if (!confirm("Are you sure you want to delete this pending fee item?")) return;
    setLoading(true);
    try {
      await deletePendingPayment(paymentId);
      toast.success("Pending payment deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">Total Paid / Waived</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-yellow-600 font-semibold uppercase tracking-wider mb-1">Total Outstanding</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Fees & Outstanding Payments</CardTitle>
            <CardDescription>Track confirmation fees, transport, and customized fee structures</CardDescription>
          </div>
          {admission.status === "DRAFT" && !collectingPayment && isWriteAllowed && (
            <Button size="sm" onClick={() => { setShowAddForm(!showAddForm); setCollectingPayment(null); }}>
              <Plus className="mr-1 h-4 w-4" />{showAddForm ? "Cancel" : "Add Pending Fee"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New pending payment form */}
          {showAddForm && (
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <h4 className="font-semibold text-sm">Add Custom Pending Fee Item</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Fee Type / Description *</Label>
                  <Input {...addForm.register("feeType")} placeholder="e.g. Books & Stationery, Uniform" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Outstanding Amount (₹) *</Label>
                  <Input type="number" min="1" step="0.01" {...addForm.register("amount")} placeholder="Enter fee amount" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Remarks</Label>
                <Input {...addForm.register("remarks")} placeholder="Optional remarks" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Fee Item
                </Button>
              </div>
            </form>
          )}

          {/* Collect payment form */}
          {collectingPayment && (
            <form onSubmit={collectForm.handleSubmit(onCollectSubmit)} className="space-y-4 rounded-lg border border-primary/20 p-4 bg-primary/5">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h4 className="font-semibold text-sm text-primary flex items-center gap-1.5">
                    <Wallet className="h-4 w-4" />
                    Collect Payment
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Recording payment of <strong>{formatCurrency(Number(collectingPayment.amount))}</strong> for <strong>{collectingPayment.feeType}</strong>
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setCollectingPayment(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Payment Mode *</Label>
                  <Select value={paymentMode} onValueChange={(v) => collectForm.setValue("paymentMode", v as any)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE", "WAIVER"].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Collection Date</Label>
                  <Input type="date" {...collectForm.register("paymentDate")} className="bg-background" />
                </div>
              </div>

              {paymentMode === "WAIVER" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-destructive">Waiver Reason *</Label>
                  <Textarea {...collectForm.register("waiverReason")} rows={2} className="bg-background" placeholder="Specify why this fee is being waived" required />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Transaction Reference / Remarks</Label>
                <Input {...collectForm.register("remarks")} className="bg-background" placeholder="Cheque number, UPI transaction ID, or cashier note" />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setCollectingPayment(null)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Collection
                </Button>
              </div>
            </form>
          )}

          {/* Payment list */}
          <div className="divide-y border-t mt-4">
            {admission.payments.map((p: any) => {
              const s = STATUS_BADGES[p.paymentStatus] ?? { label: p.paymentStatus, variant: "outline" };
              const canCollect = (p.paymentStatus === "PENDING" || p.paymentStatus === "PARTIAL") && admission.status === "DRAFT";
              const canDelete = canCollect && p.feeType !== "Confirmation Fee";

              return (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{p.feeType}</p>
                      <Badge variant={s.variant} className="text-[10px] px-1.5 py-0">{s.label}</Badge>
                    </div>
                    
                    {p.paymentStatus === "PAID" || p.paymentStatus === "WAIVED" ? (
                      <p className="text-xs text-muted-foreground leading-normal">
                        Mode: <span className="font-medium text-foreground">{p.paymentMode}</span>
                        {p.paymentDate && <> · Date: <span className="font-medium text-foreground">{formatDate(p.paymentDate)}</span></>}
                        {p.collectedBy && <> · Cashier: <span className="font-medium text-foreground">{p.collectedBy.fullName}</span></>}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic leading-normal">
                        Outstanding invoice. Not paid yet.
                      </p>
                    )}

                    {p.receiptNo && (
                      <p className="text-[11px] font-mono text-green-700 font-semibold bg-green-500/5 w-fit px-1.5 py-0.5 rounded border border-green-500/10">
                        Rcpt: {p.receiptNo}
                      </p>
                    )}
                    {p.remarks && <p className="text-xs text-muted-foreground/80 font-medium">Remarks: {p.remarks}</p>}
                    {p.waiverReason && <p className="text-xs text-red-600 font-medium bg-red-500/5 border border-red-500/10 rounded px-2 py-0.5 w-fit">Waiver Reason: {p.waiverReason}</p>}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <p className="font-bold text-sm sm:text-base text-foreground">{formatCurrency(Number(p.amount))}</p>
                    
                    {canCollect && !collectingPayment && isWriteAllowed && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-primary text-primary hover:bg-primary hover:text-white"
                        onClick={() => {
                          setCollectingPayment(p);
                          setShowAddForm(false);
                          collectForm.reset({
                            paymentMode: "CASH",
                            paymentDate: new Date().toISOString().split("T")[0],
                            remarks: "",
                            waiverReason: "",
                          });
                        }}
                        disabled={loading}
                      >
                        Collect
                      </Button>
                    )}

                    {canDelete && isWriteAllowed && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(p.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {admission.payments.length === 0 && (
              <div className="py-8 text-center">
                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No payments or fee invoices recorded yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
