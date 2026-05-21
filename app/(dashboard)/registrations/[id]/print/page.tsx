import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "./print-button";

export default async function PrintRegistrationPage({ params }: { params: { id: string } }) {
  const reg = await prisma.registration.findUnique({
    where: { id: params.id },
    include: { grade: true, academicYear: true, campus: true, enquirySource: true },
  });
  if (!reg) notFound();

  return (
    <div className="mx-auto max-w-2xl p-8 print:p-0">
      <div className="no-print mb-6 flex gap-2">
        <PrintButton />
      </div>

      {/* Printable content */}
      <div className="rounded-lg border bg-white p-8">
        <div className="mb-6 border-b pb-4 text-center">
          <h1 className="text-2xl font-bold">{process.env.NEXT_PUBLIC_SCHOOL_NAME || "Junior School"}</h1>
          <p className="text-lg font-semibold text-blue-700 mt-1">Registration Acknowledgement</p>
          <p className="text-sm text-gray-500">{reg.campus.name} · {reg.academicYear.label}</p>
        </div>

        <div className="mb-4 rounded-lg bg-blue-50 p-4 text-center">
          <p className="text-sm text-blue-600">Registration Number</p>
          <p className="text-2xl font-mono font-bold text-blue-700">{reg.registrationNo}</p>
          <p className="text-xs text-blue-500 mt-1">Date: {formatDate(reg.registrationDate)}</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ["Student Name", reg.studentName],
            ["Date of Birth", formatDate(reg.dateOfBirth)],
            ["Gender", reg.gender],
            ["Applied Grade", reg.grade.name],
            ["Father Name", reg.fatherName ?? "-"],
            ["Father Mobile", reg.fatherMobile ?? "-"],
            ["Mother Name", reg.motherName ?? "-"],
            ["Mother Mobile", reg.motherMobile ?? "-"],
            ["Address", [reg.address1, reg.city, reg.state, reg.pinCode].filter(Boolean).join(", ") || "-"],
            ["Previous School", reg.prevSchoolName ?? "-"],
            ["Special Support", reg.specialSupport ? "Yes" : "No"],
          ].map(([label, value]) => (
            <div key={label} className="border-b pb-2">
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 text-xs text-gray-400 text-center">
          <p>This is a computer-generated acknowledgement. Please retain this for your records.</p>
          <p>Contact the school office for admission enquiries.</p>
        </div>
      </div>
    </div>
  );
}
