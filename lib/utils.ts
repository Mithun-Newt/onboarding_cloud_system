import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInYears } from "date-fns";
import { prisma } from "@/lib/prisma";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "yyyy-MM-dd");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "yyyy-MM-dd HH:mm");
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

export function splitFullName(fullName: string | null | undefined) {
  if (!fullName) return { firstName: "", middleName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", middleName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], middleName: "", lastName: "" };
  if (parts.length === 2) return { firstName: parts[0], middleName: "", lastName: parts[1] };
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const middleName = parts.slice(1, parts.length - 1).join(" ");
  return { firstName, middleName, lastName };
}

export function calculateAgeToday(dobString: Date | string | null | undefined): string {
  if (!dobString) return "";
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return "";
  const today = new Date();
  
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  }
  if (years === 0 && months === 0 && days >= 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }
  return parts.join(", ");
}

export function getEligibleGradeName(dob: Date | string, startYear: number, ageRelaxation: boolean = false): string | null {
  const dateObj = new Date(dob);
  if (isNaN(dateObj.getTime())) return null;
  
  // Shift target date threshold from March 31st to June 30th if age relaxation is active
  const targetDate = ageRelaxation ? new Date(startYear, 5, 30) : new Date(startYear, 2, 31);
  
  let age = targetDate.getFullYear() - dateObj.getFullYear();
  const m = targetDate.getMonth() - dateObj.getMonth();
  if (m < 0 || (m === 0 && targetDate.getDate() < dateObj.getDate())) {
    age--;
  }

  if (age === 3) return "Pre-KG";
  if (age === 4) return "LKG";
  if (age === 5) return "UKG";
  if (age === 6) return "Grade 1";
  if (age === 7) return "Grade 2";
  return null;
}

