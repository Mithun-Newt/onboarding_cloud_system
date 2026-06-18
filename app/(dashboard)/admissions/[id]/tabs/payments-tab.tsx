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
import { Loader2, Plus, Trash2, Check, X, Wallet, Info, Printer } from "lucide-react";
import Link from "next/link";

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
  const isWriteAllowed = roles.includes("SYSTEM_ADMIN") || roles.includes("TIC") || roles.includes("ADMISSION_STAFF") || roles.includes("CASHIER");

  const guardians = admission.student?.family?.guardians ?? [];
  const father = guardians.find((g: any) => g.relationship === "FATHER");
  const mother = guardians.find((g: any) => g.relationship === "MOTHER");

  const [showAddForm, setShowAddForm] = useState(false);
  const [collectingPayment, setCollectingPayment] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [printingReceipt, setPrintingReceipt] = useState<any | null>(null);

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
      amount: "",
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
        amount: data.amount ? parseFloat(data.amount) : undefined,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
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

      <Card className="no-print">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Fees & Outstanding Payments</CardTitle>
            <CardDescription>Track confirmation fees, transport, and customized fee structures</CardDescription>
          </div>
          {admission.status !== "CANCELLED" && !collectingPayment && isWriteAllowed && (
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Collected Amount (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...collectForm.register("amount")}
                    required
                    className="bg-background"
                    placeholder="Enter amount"
                  />
                </div>
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
              const canCollect = (p.paymentStatus === "PENDING" || p.paymentStatus === "PARTIAL") && admission.status !== "CANCELLED";
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
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-mono text-green-700 font-semibold bg-green-500/5 w-fit px-1.5 py-0.5 rounded border border-green-500/10">
                          Rcpt: {p.receiptNo}
                        </p>
                        {admission.status === "CONFIRMED" && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 px-1.5 text-[10px] text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => setPrintingReceipt(p)}
                          >
                            <Printer className="h-3 w-3 mr-1" /> Print Receipt
                          </Button>
                        )}
                      </div>
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
                            amount: p.amount > 0 ? p.amount.toString() : "",
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

      {printingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:absolute print:inset-0 print:bg-transparent print:p-0 print:block print:z-auto">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #print-receipt-modal, #print-receipt-modal * {
                visibility: visible;
              }
              #print-receipt-modal {
                position: relative !important;
                left: auto !important;
                top: auto !important;
                margin: 2cm auto !important;
                padding: 1.5cm !important;
                width: 100% !important;
                max-width: 15cm !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 8px !important;
                box-shadow: none !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 1.25rem !important;
                font-size: 13px !important;
              }
              #print-receipt-modal h1 {
                font-size: 18px !important;
              }
              #print-receipt-modal h2 {
                font-size: 15px !important;
              }
              #print-receipt-modal .grid {
                font-size: 13px !important;
                gap: 12px !important;
              }
              #print-receipt-modal table {
                font-size: 13px !important;
              }
              #print-receipt-modal table th, #print-receipt-modal table td {
                padding: 8px 6px !important;
              }
              #print-receipt-modal .bg-muted\/20 {
                font-size: 13px !important;
                padding: 12px !important;
              }
              #print-receipt-modal img {
                width: 60px !important;
                height: 60px !important;
              }
              /* Collapse layout parents in print to avoid blank pages */
              .space-y-6, main, .flex-col, .ml-64, .flex, .min-h-screen {
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                min-height: 0 !important;
              }
            }
          `}} />
          <div 
            id="print-receipt-modal" 
            className="w-full max-w-md bg-white rounded-lg border shadow-lg p-6 relative flex flex-col gap-4 text-xs text-foreground"
          >
            {/* Header Section */}
            <div className="flex items-center gap-3 border-b pb-3">
              <img
                src="/logo/appu-arivaalayem-logo.png"
                alt="School Logo"
                className="h-12 w-12 object-contain"
              />
              <div className="text-left">
                <h1 className="text-sm font-bold">{process.env.NEXT_PUBLIC_SCHOOL_NAME || "Appu Arivaalayam"}</h1>
                <p className="text-[10px] text-muted-foreground">{admission.campus.name}</p>
                <p className="text-[10px] text-muted-foreground">Academic Year: {admission.academicYear.label}</p>
              </div>
            </div>

            {/* Receipt Title */}
            <div className="text-center bg-muted/30 py-1 rounded">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fee Receipt</h2>
            </div>

            {/* Receipt Details Block */}
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 pb-3 border-b text-[11px]">
              <div>
                <span className="text-muted-foreground font-medium">Receipt No:</span>
                <span className="ml-1 font-semibold font-mono text-foreground">{printingReceipt.receiptNo || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Date:</span>
                <span className="ml-1 font-semibold text-foreground">{formatDate(printingReceipt.paymentDate)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground font-medium">Student Name:</span>
                <span className="ml-1 font-semibold text-foreground">{admission.student.fullNameEn}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Class / Grade:</span>
                <span className="ml-1 font-semibold text-foreground">{admission.grade.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Parent Name:</span>
                <span className="ml-1 font-semibold text-foreground">{father?.fullName || mother?.fullName || "N/A"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground font-medium">Admission No:</span>
                <span className="ml-1 font-semibold text-foreground font-mono">{admission.admissionNo || "-"}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border rounded overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b text-[10px] uppercase font-semibold text-muted-foreground">
                    <th className="px-2 py-1.5">Fee Description</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-2 py-2 text-foreground font-medium">{printingReceipt.feeType}</td>
                    <td className="px-2 py-2 text-right text-foreground font-semibold">{formatCurrency(Number(printingReceipt.amount))}</td>
                  </tr>
                  <tr className="bg-muted/20 font-semibold">
                    <td className="px-2 py-2 text-[10px] uppercase text-muted-foreground">Total Paid Amount</td>
                    <td className="px-2 py-2 text-right text-green-700 font-bold">{formatCurrency(Number(printingReceipt.amount))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Info */}
            <div className="bg-muted/20 p-2.5 rounded text-[11px] grid grid-cols-2 gap-y-1 gap-x-2">
              <div>
                <span className="text-muted-foreground font-medium">Payment Mode:</span>
                <span className="ml-1 font-semibold text-foreground">{printingReceipt.paymentMode}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Status:</span>
                <span className="ml-1 font-bold text-green-700">{printingReceipt.paymentStatus}</span>
              </div>
              {printingReceipt.remarks && (
                <div className="col-span-2">
                  <span className="text-muted-foreground font-medium">Remarks:</span>
                  <span className="ml-1 text-foreground font-mono">{printingReceipt.remarks}</span>
                </div>
              )}
              {printingReceipt.collectedBy && (
                <div className="col-span-2">
                  <span className="text-muted-foreground font-medium">Collected By (Cashier):</span>
                  <span className="ml-1 text-foreground font-medium">{printingReceipt.collectedBy.fullName}</span>
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-4 text-[10px] pt-4 border-t border-dashed mt-2">
              <div className="text-center pt-6 border-t w-28 mx-auto">
                <span className="text-muted-foreground">Parent's Sign</span>
              </div>
              <div className="text-center pt-6 border-t w-28 mx-auto">
                <span className="text-muted-foreground">Authorized Sign</span>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t no-print">
              <Button variant="outline" size="sm" onClick={() => setPrintingReceipt(null)}>
                Close
              </Button>
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
