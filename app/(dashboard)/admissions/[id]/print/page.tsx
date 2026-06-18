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
      student: {
        include: {
          family: { include: { guardians: true } },
          medicalProfile: true,
        },
      },
      prevSchool: true,
      transportReq: { include: { route: true, stop: true } },
      payments: { include: { collectedBy: { select: { fullName: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!admission) notFound();

  return (
    <div className="mx-auto max-w-2xl p-8 print:p-0 print:max-w-none print:w-full print:m-0">
      <div className="no-print mb-6 flex gap-2">
        <PrintButton />
      </div>

      <div className="rounded-lg border bg-white p-8 print:border-none print:p-0 print:rounded-none print:shadow-none">
        {/* Header Section with Logo and Photo slot */}
        <div className="mb-6 border-b pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/logo/appu-arivaalayem-logo.png"
              alt="School Logo"
              className="h-16 w-16 object-contain"
            />
            <div className="text-left">
              <h1 className="text-2xl font-bold">{process.env.NEXT_PUBLIC_SCHOOL_NAME || "Appu Arivaalayam"}</h1>
              <p className="text-lg font-semibold text-blue-700 mt-0.5">Admission Application Form</p>
              <p className="text-sm text-gray-500">{admission.campus.name} · Academic Year: {admission.academicYear.label}</p>
            </div>
          </div>
          <div className="border border-dashed border-gray-400 w-28 h-36 flex flex-col items-center justify-center text-center p-2 rounded shrink-0">
            <span className="text-[10px] text-gray-400 font-medium leading-tight">Paste Recent Passport Size Photo Here</span>
          </div>
        </div>

        {/* Section 1: Admission Details */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded mb-3">1. Admission Information</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <dt className="text-gray-500 font-medium">Admission Number</dt>
              <dd className="font-semibold text-blue-700 font-mono text-sm">{admission.admissionNo ?? "Draft"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Admission Status</dt>
              <dd className="font-semibold">{admission.status}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Registration Number</dt>
              <dd className="font-semibold font-mono">{admission.registration.registrationNo}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Applied Grade</dt>
              <dd className="font-semibold">{admission.grade.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Academic Year</dt>
              <dd className="font-semibold">{admission.academicYear.label}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Confirmed At</dt>
              <dd className="font-semibold">{formatDate(admission.confirmedAt)}</dd>
            </div>
          </dl>
        </div>

        {/* Section 2: Student Profile */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded mb-3">2. Student Profile</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <dt className="text-gray-500 font-medium">Given Name (English)</dt>
              <dd className="font-semibold">{admission.student.givenName || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Surname (English)</dt>
              <dd className="font-semibold">{admission.student.surname || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Given Name (Tamil)</dt>
              <dd className="font-semibold">{admission.student.givenNameTa || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Surname (Tamil)</dt>
              <dd className="font-semibold">{admission.student.surnameTa || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Date of Birth</dt>
              <dd className="font-semibold">{formatDate(admission.student.dateOfBirth)}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Gender</dt>
              <dd className="font-semibold">{admission.student.gender}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Blood Group</dt>
              <dd className="font-semibold">{admission.student.bloodGroup || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Religion</dt>
              <dd className="font-semibold">{admission.student.religion || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Community</dt>
              <dd className="font-semibold">{admission.student.community || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Category</dt>
              <dd className="font-semibold">{admission.student.category || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Mother Tongue</dt>
              <dd className="font-semibold">{admission.student.motherTongue || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Nationality</dt>
              <dd className="font-semibold">{admission.student.nationality}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">EMIS Number</dt>
              <dd className="font-semibold">{admission.student.emisNumber || "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 font-medium">Aadhaar Number</dt>
              <dd className="font-semibold">{admission.student.aadhaarNo || "-"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500 font-medium">Residential Address</dt>
              <dd className="font-semibold">
                {[admission.student.address1, admission.student.address2, admission.student.city, admission.student.state, admission.student.pinCode].filter(Boolean).join(", ") || "-"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500 font-medium">Residential Address (Tamil)</dt>
              <dd className="font-semibold">
                {[admission.student.address1Ta, admission.student.address2Ta, admission.student.cityTa].filter(Boolean).join(", ") || "-"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Section 3: Parent / Guardian Information */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded mb-3">3. Parent / Guardian Information</h3>
          {admission.student.family && admission.student.family.guardians && admission.student.family.guardians.length > 0 ? (
            <div className="space-y-4">
              {admission.student.family.guardians.map((g: any) => (
                <div key={g.id} className="border-b pb-2 last:border-0 last:pb-0">
                  <p className="font-bold text-xs text-blue-700 uppercase tracking-wider mb-1">{g.relationship}</p>
                  <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <dt className="text-gray-500">Full Name</dt>
                      <dd className="font-semibold">{g.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Mobile</dt>
                      <dd className="font-semibold">{g.mobile || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Email</dt>
                      <dd className="font-semibold">{g.email || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Education</dt>
                      <dd className="font-semibold">{g.education || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Occupation</dt>
                      <dd className="font-semibold">{g.occupation || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Annual Income</dt>
                      <dd className="font-semibold">{g.annualIncome ? `₹${g.annualIncome}` : "-"}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No parent/guardian information recorded.</p>
          )}
        </div>

        {/* Section 4: Previous School */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded mb-3">4. Previous School Information</h3>
          {admission.prevSchool ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div>
                <dt className="text-gray-500">School Name</dt>
                <dd className="font-semibold">{admission.prevSchool.schoolName || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd className="font-semibold">{admission.prevSchool.schoolAddress || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Class Passed</dt>
                <dd className="font-semibold">{admission.prevSchool.lastClassPassed || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">TC Number</dt>
                <dd className="font-semibold">{admission.prevSchool.tcNumber || "-"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-gray-500">No previous school details recorded.</p>
          )}
        </div>

        {/* Section 5: Medical */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded mb-3">5. Medical Profile</h3>
          {admission.student.medicalProfile ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div>
                <dt className="text-gray-500">Walking Status</dt>
                <dd className="font-semibold">{admission.student.medicalProfile.walkingStatus || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Speech Status</dt>
                <dd className="font-semibold">{admission.student.medicalProfile.speechStatus || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Has Allergies</dt>
                <dd className="font-semibold">{admission.student.medicalProfile.hasAllergies ? "Yes" : "No"}</dd>
              </div>
              {admission.student.medicalProfile.hasAllergies && (
                <div>
                  <dt className="text-gray-500">Allergy Details</dt>
                  <dd className="font-semibold">{admission.student.medicalProfile.allergyDetails || "-"}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Requires Daily Medication</dt>
                <dd className="font-semibold">{admission.student.medicalProfile.needsMedication ? "Yes" : "No"}</dd>
              </div>
              {admission.student.medicalProfile.needsMedication && (
                <div>
                  <dt className="text-gray-500">Medication Details</dt>
                  <dd className="font-semibold">{admission.student.medicalProfile.medicationDetails || "-"}</dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="text-gray-500">Health Issues</dt>
                <dd className="font-semibold">{admission.student.medicalProfile.healthIssues || "-"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">Special Attention Notes</dt>
                <dd className="font-semibold">{admission.student.medicalProfile.specialAttention || "-"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-gray-500">No medical profile recorded.</p>
          )}
        </div>

        {/* Section 6: Transport */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded mb-3">6. Transport Service</h3>
          {admission.transportReq?.required ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div>
                <dt className="text-gray-500">Stage</dt>
                <dd className="font-semibold">{admission.transportReq.route ? admission.transportReq.route.name : "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Place Name</dt>
                <dd className="font-semibold">{admission.transportReq.stop?.stopName || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Distance (Km)</dt>
                <dd className="font-semibold">{admission.transportReq.stop?.distance || "-"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Bus Number</dt>
                <dd className="font-semibold">{admission.transportReq.busNo || "-"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">Remarks</dt>
                <dd className="font-semibold">{admission.transportReq.remarks || "-"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-gray-500">Transport service not required.</p>
          )}
        </div>

        {/* Section 7: Fee Payments */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded mb-3">7. Fee Receipts & Payments</h3>
          {admission.payments?.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-1">Fee Type</th>
                  <th className="py-1">Receipt No</th>
                  <th className="py-1">Mode</th>
                  <th className="py-1 text-right">Amount</th>
                  <th className="py-1 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {admission.payments.map((p: any) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-1 font-medium">{p.feeType}</td>
                    <td className="py-1 font-mono">{p.receiptNo || "Pending"}</td>
                    <td className="py-1">{p.paymentMode}</td>
                    <td className="py-1 text-right font-semibold">₹{Number(p.amount).toFixed(2)}</td>
                    <td className="py-1 text-right">{p.paymentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-gray-500">No payment invoices or collections recorded.</p>
          )}
        </div>

        {/* Signatures Section */}
        <div className="mt-16 space-y-12">
          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="border-b border-gray-400 w-full h-8"></div>
              <p className="mt-2 text-[11px] font-semibold text-gray-600">Father's Signature</p>
            </div>
            <div>
              <div className="border-b border-gray-400 w-full h-8"></div>
              <p className="mt-2 text-[11px] font-semibold text-gray-600">Mother's Signature</p>
            </div>
            <div>
              <div className="border-b border-gray-400 w-full h-8"></div>
              <p className="mt-2 text-[11px] font-semibold text-gray-600">Guardian's Signature</p>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="border-b border-gray-400 w-full h-8"></div>
              <p className="mt-2 text-[11px] font-semibold text-gray-600">Admission Staff's Signature</p>
            </div>
            <div>
              <div className="border-b border-gray-400 w-full h-8"></div>
              <p className="mt-2 text-[11px] font-semibold text-gray-600">TIC's Signature</p>
            </div>
            <div>
              <div className="border-b border-gray-400 w-full h-8"></div>
              <p className="mt-2 text-[11px] font-semibold text-gray-600">Principal's Signature</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-[10px] text-gray-400">
          <p>This is a computer-generated summary. Please retain this for your records.</p>
        </div>
      </div>
    </div>
  );
}
