import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function PrintAdmissionPage({ params }: { params: { id: string } }) {
  const admission = await prisma.admissionApplication.findUnique({
    where: { id: params.id },
    include: {
      registration: true,
      grade: true,
      academicYear: true,
      campus: true,
      student: true,
    },
  });
  if (!admission) notFound();

  return (
    <div className="mx-auto max-w-2xl p-8 print:p-0">
      <div className="no-print mb-6 flex gap-2">
        <PrintButton />
      </div>

      <div className="rounded-lg border bg-white p-8">
        <div className="mb-6 border-b pb-4 text-center">
          <h1 className="text-2xl font-bold">{process.env.NEXT_PUBLIC_SCHOOL_NAME || "Appu Arivaalayem"}</h1>
          <p className="text-lg font-semibold text-blue-700 mt-1">Admission Summary</p>
          <p className="text-sm text-gray-500">{admission.campus.name} · {admission.academicYear.label}</p>
        </div>

        <div className="mb-4 rounded-lg bg-blue-50 p-4 text-center">
          <p className="text-sm text-blue-600">Admission Number</p>
          <p className="text-2xl font-mono font-bold text-blue-700">{admission.admissionNo ?? "-"}</p>
          <p className="text-xs text-blue-500 mt-1">Status: {admission.status}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ["Student Name", admission.student.fullNameEn],
            ["Date of Birth", formatDate(admission.student.dateOfBirth)],
            ["Gender", admission.student.gender],
            ["Applied Grade", admission.grade.name],
            ["Registration No", admission.registration.registrationNo],
            ["Registration Date", formatDate(admission.registration.registrationDate)],
            ["Confirmed At", formatDate(admission.confirmedAt)],
          ].map(([label, value]) => (
            <div key={label} className="border-b pb-2">
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="font-medium">{value || "-"}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 text-xs text-gray-400 text-center">
          <p>This is a computer-generated summary. Please retain this for your records.</p>
        </div>
      </div>
    </div>
  );
}

