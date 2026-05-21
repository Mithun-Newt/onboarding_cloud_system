import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInYears } from "date-fns";
import { prisma } from "@/lib/prisma";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "dd/MM/yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "dd/MM/yyyy HH:mm");
}

export function calculateAge(dob: Date | string, cutoffDate?: string): string {
  const birthDate = new Date(dob);
  const cutoff = cutoffDate
    ? new Date(`${new Date().getFullYear()}-${cutoffDate}`)
    : new Date(`${new Date().getFullYear()}-07-31`);
  const years = differenceInYears(cutoff, birthDate);
  return `${years} years`;
}

export async function generateSequenceNumber(
  type: string,
  academicYear: string
): Promise<number> {
  const seq = await prisma.numberSequence.upsert({
    where: { sequenceType_academicYear: { sequenceType: type, academicYear } },
    update: { lastNumber: { increment: 1 } },
    create: { sequenceType: type, academicYear, lastNumber: 1 },
  });
  return seq.lastNumber;
}

export function formatRegistrationNo(year: string, seq: number): string {
  return `REG-${year}-${String(seq).padStart(4, "0")}`;
}

export function formatAdmissionNo(year: string, seq: number): string {
  return `ADM-${year}-${String(seq).padStart(4, "0")}`;
}

export function formatReceiptNo(year: string, seq: number): string {
  return `RCP-${year}-${String(seq).padStart(4, "0")}`;
}

export function getAcademicYearCode(label: string): string {
  return label.split("-")[0] ?? label;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function maskAadhaar(last4: string | null | undefined): string {
  if (!last4) return "-";
  return `XXXX XXXX ${last4}`;
}
