import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function PrintReceiptPage({
  params,
}: {
  params: { id: string; paymentId: string };
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    include: {
      collectedBy: { select: { fullName: true } },
      admission: {
        include: {
          academicYear: true,
          campus: true,
          grade: true,
          registration: true,
          student: {
            include: {
              family: { include: { guardians: true } },
            },
          },
        },
      },
    },
  });

  if (!payment || payment.admissionId !== params.id || payment.admission.status !== "CONFIRMED") notFound();

  const student = payment.admission.student;
  const father = student.family?.guardians.find((g: any) => g.relationship === "FATHER");
  const mother = student.family?.guardians.find((g: any) => g.relationship === "MOTHER");
  const parentName = father?.fullName || mother?.fullName || "N/A";

  return (
    <div className="mx-auto max-w-xl p-8 print:p-0 print:max-w-[15cm] print:mx-auto print:my-[2cm] bg-white">
      <div className="no-print mb-6 flex gap-2">
        <PrintButton />
      </div>

      <div className="rounded-lg border bg-white p-8 print:border print:border-gray-200 print:rounded-lg print:shadow-none">
        {/* Header Section */}
        <div className="mb-6 border-b pb-4 flex items-center gap-4">
          <img
            src="/logo/appu-arivaalayem-logo.png"
            alt="School Logo"
            className="h-16 w-16 object-contain"
          />
          <div className="text-left">
            <h1 className="text-xl font-bold">{process.env.NEXT_PUBLIC_SCHOOL_NAME || "Appu Arivaalayem"}</h1>
            <p className="text-xs text-gray-500">{payment.admission.campus.name}</p>
            <p className="text-xs text-gray-500">Academic Year: {payment.admission.academicYear.label}</p>
          </div>
        </div>

        {/* Receipt Header Banner */}
        <div className="mb-6 text-center border-y py-2 bg-gray-50/50">
          <h2 className="text-base font-bold uppercase tracking-wider text-gray-700">Fee Receipt</h2>
        </div>

        {/* Receipt Details Block */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mb-6 pb-4 border-b">
          <div>
            <span className="text-gray-500 font-medium">Receipt No:</span>
            <span className="ml-1.5 font-semibold text-gray-900 font-mono">{payment.receiptNo || "-"}</span>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Date:</span>
            <span className="ml-1.5 font-semibold text-gray-900">{formatDate(payment.paymentDate)}</span>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Student Name:</span>
            <span className="ml-1.5 font-semibold text-gray-900">{student.fullNameEn}</span>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Class / Grade:</span>
            <span className="ml-1.5 font-semibold text-gray-900">{payment.admission.grade.name}</span>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Parent Name:</span>
            <span className="ml-1.5 font-semibold text-gray-900">{parentName}</span>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Admission No:</span>
            <span className="ml-1.5 font-semibold text-gray-900 font-mono">{payment.admission.admissionNo || "-"}</span>
          </div>
        </div>

        {/* Payment Summary Table */}
        <div className="mb-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500 uppercase tracking-wider text-[10px]">
                <th className="px-3 py-2 font-semibold">Fee Description</th>
                <th className="px-3 py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-3 py-3 text-gray-900 font-medium">{payment.feeType}</td>
                <td className="px-3 py-3 text-right text-gray-900 font-semibold">{formatCurrency(Number(payment.amount))}</td>
              </tr>
              <tr className="font-semibold bg-gray-50/50">
                <td className="px-3 py-2.5 text-right text-gray-500 uppercase text-[10px]">Total Paid Amount</td>
                <td className="px-3 py-2.5 text-right text-sm text-green-700 font-bold">{formatCurrency(Number(payment.amount))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Info Metadata */}
        <div className="bg-gray-50 p-3 rounded text-xs grid grid-cols-2 gap-y-1.5 gap-x-4 mb-8">
          <div>
            <span className="text-gray-500 font-medium">Payment Mode:</span>
            <span className="ml-1.5 font-semibold text-gray-900">{payment.paymentMode}</span>
          </div>
          <div>
            <span className="text-gray-500 font-medium">Status:</span>
            <span className="ml-1.5 font-semibold text-green-700 font-bold">{payment.paymentStatus}</span>
          </div>
          {payment.remarks && (
            <div className="col-span-2">
              <span className="text-gray-500 font-medium">Remarks / Transaction ID:</span>
              <span className="ml-1.5 text-gray-700 font-mono font-medium">{payment.remarks}</span>
            </div>
          )}
          {payment.collectedBy && (
            <div className="col-span-2">
              <span className="text-gray-500 font-medium">Collected By (Cashier):</span>
              <span className="ml-1.5 text-gray-700 font-medium">{payment.collectedBy.fullName}</span>
            </div>
          )}
        </div>

        {/* Signatures Row */}
        <div className="grid grid-cols-2 gap-8 text-xs pt-8 border-t border-dashed">
          <div className="text-center pt-8 border-t border-gray-200 w-36 mx-auto">
            <span className="text-gray-500 block">Parent's Signature</span>
          </div>
          <div className="text-center pt-8 border-t border-gray-200 w-36 mx-auto">
            <span className="text-gray-500 block">Authorized Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
}
