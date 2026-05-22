"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { generateSequenceNumber, formatReceiptNo, getAcademicYearCode } from "@/lib/utils";
import { PaymentMode, PaymentStatus } from "@prisma/client";

interface RecordPaymentInput {
  feeType: string;
  amount: number;
  remarks?: string;
}

export async function recordPayment(admissionId: string, data: RecordPaymentInput) {
  const session = await requireAuth();

  const admission = await prisma.admissionApplication.findUnique({
    where: { id: admissionId },
  });
  if (!admission) throw new Error("Admission not found");

  const payment = await prisma.payment.create({
    data: {
      admissionId,
      feeType: data.feeType,
      amount: data.amount,
      paymentMode: PaymentMode.CASH, // Default placeholder
      paymentStatus: PaymentStatus.PENDING,
      remarks: data.remarks,
    },
  });

  await createAuditLog({
    actorUserId: session.user.id,
    action: "RECORD_PENDING_PAYMENT",
    entityType: "Payment",
    entityId: payment.id,
    newValue: { feeType: data.feeType, amount: data.amount },
  });

  revalidatePath(`/admissions/${admissionId}`);
  revalidatePath("/payments");
  return payment;
}

interface CollectPaymentInput {
  paymentMode: string;
  paymentDate?: string;
  chequeNo?: string;
  bankName?: string;
  upiRef?: string;
  waiverReason?: string;
  remarks?: string;
}

export async function collectPayment(paymentId: string, data: CollectPaymentInput) {
  const session = await requireAuth();

  if (data.paymentMode === "WAIVER" && !data.waiverReason) {
    throw new Error("Waiver reason is required");
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { admission: { include: { registration: { include: { academicYear: true } } } } },
  });
  if (!payment) throw new Error("Payment not found");

  // Generate receipt no
  const yearCode = getAcademicYearCode(payment.admission.registration.academicYear.label);
  const seq = await generateSequenceNumber("RECEIPT", yearCode);
  const receiptNo = formatReceiptNo(yearCode, seq);

  const paymentStatus =
    data.paymentMode === "WAIVER"
      ? PaymentStatus.WAIVED
      : PaymentStatus.PAID;

  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      receiptNo,
      paymentMode: data.paymentMode as PaymentMode,
      paymentStatus,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      collectedById: session.user.id,
      chequeNo: data.chequeNo,
      bankName: data.bankName,
      upiRef: data.upiRef,
      waiverReason: data.waiverReason,
      remarks: data.remarks,
    },
  });

  await createAuditLog({
    actorUserId: session.user.id,
    action: "COLLECT_PAYMENT",
    entityType: "Payment",
    entityId: paymentId,
    newValue: { receiptNo, amount: Number(payment.amount), paymentStatus },
  });

  revalidatePath(`/admissions/${payment.admissionId}`);
  revalidatePath("/payments");
  return updatedPayment;
}

export async function deletePendingPayment(paymentId: string) {
  const session = await requireAuth();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) throw new Error("Payment not found");

  if (payment.feeType === "Confirmation Fee") {
    throw new Error("Confirmation Fee is mandatory and cannot be deleted");
  }
  if (payment.paymentStatus !== "PENDING" && payment.paymentStatus !== "PARTIAL") {
    throw new Error("Only pending or partial payments can be deleted");
  }

  await prisma.payment.delete({
    where: { id: paymentId },
  });

  await createAuditLog({
    actorUserId: session.user.id,
    action: "DELETE_PENDING_PAYMENT",
    entityType: "Payment",
    entityId: paymentId,
    oldValue: { feeType: payment.feeType, amount: Number(payment.amount) },
  });

  revalidatePath(`/admissions/${payment.admissionId}`);
  revalidatePath("/payments");
}


export async function getPayments(params: {
  academicYearId?: string;
  admissionId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (params.admissionId) where.admissionId = params.admissionId;
  if (params.academicYearId) {
    where.admission = { academicYearId: params.academicYearId };
  }

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        admission: {
          include: {
            student: { select: { fullNameEn: true } },
            grade: true,
          },
        },
        collectedBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.payment.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
