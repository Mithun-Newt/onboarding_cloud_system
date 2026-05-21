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
  paymentMode: string;
  paymentDate?: string;
  chequeNo?: string;
  bankName?: string;
  upiRef?: string;
  waiverReason?: string;
  remarks?: string;
}

export async function recordPayment(admissionId: string, data: RecordPaymentInput) {
  const session = await requireAuth();

  if (data.paymentMode === "WAIVER" && !data.waiverReason) {
    throw new Error("Waiver reason is required");
  }

  const admission = await prisma.admissionApplication.findUnique({
    where: { id: admissionId },
    include: { registration: { include: { academicYear: true } } },
  });
  if (!admission) throw new Error("Admission not found");

  const yearCode = getAcademicYearCode(admission.registration.academicYear.label);
  const seq = await generateSequenceNumber("RECEIPT", yearCode);
  const receiptNo = formatReceiptNo(yearCode, seq);

  const paymentStatus =
    data.paymentMode === "WAIVER"
      ? PaymentStatus.WAIVED
      : PaymentStatus.PAID;

  const payment = await prisma.payment.create({
    data: {
      admissionId,
      receiptNo,
      feeType: data.feeType,
      amount: data.amount,
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
    action: "RECORD_PAYMENT",
    entityType: "Payment",
    entityId: payment.id,
    newValue: { receiptNo, feeType: data.feeType, amount: data.amount },
  });

  revalidatePath(`/admissions/${admissionId}`);
  revalidatePath("/payments");
  return payment;
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
