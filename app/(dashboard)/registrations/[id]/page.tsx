import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, FileText, ArrowRight, ArrowLeft } from "lucide-react";
import { CancelRegistrationButton } from "./cancel-button";
import { StartAdmissionButton } from "./start-admission-button";
import { getSession } from "@/lib/auth";

const STATUS_BADGES: Record<string, { label: string; variant: any }> = {
  REGISTERED: { label: "Registered", variant: "info" },
  ADMISSION_STARTED: { label: "Admission Started", variant: "warning" },
  ADMITTED: { label: "Admitted", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export default async function RegistrationDetailPage({ params }: { params: { id: string } }) {
  const [session, reg] = await Promise.all([
    getSession(),
    prisma.registration.findUnique({
      where: { id: params.id },
      include: {
        grade: true,
        academicYear: true,
        campus: true,
        enquirySource: true,
        admissions: {
          select: { id: true, admissionNo: true, status: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  if (!reg) notFound();

  const roles = (session?.user as any)?.roles || [];
  const isWriteAllowed = roles.includes("SYSTEM_ADMIN") || roles.includes("TIC") || roles.includes("ADMISSION_STAFF");

  const status = STATUS_BADGES[reg.status] ?? { label: reg.status, variant: "outline" };
  const latestAdmission = reg.admissions[0];

  const fields = [
    ["Registration No.", reg.registrationNo],
    ["Academic Year", reg.academicYear.label],
    ["Campus", reg.campus.name],
    ["Applied Grade", reg.grade.name],
    ["Registration Date", formatDate(reg.registrationDate)],
    ["Status", null],
    ["Student Name", reg.studentName],
    ["Date of Birth", formatDate(reg.dateOfBirth)],
    ["Gender", reg.gender],
    ["Father Name", reg.fatherName ?? "-"],
    ["Father Mobile", reg.fatherMobile ?? "-"],
    ["Mother Name", reg.motherName ?? "-"],
    ["Mother Mobile", reg.motherMobile ?? "-"],
    ["Primary Contact", reg.primaryContact ?? "-"],
    ["Previous School", reg.prevSchoolName ?? "-"],
    ["Address", [reg.address1, reg.address2, reg.city, reg.state, reg.pinCode].filter(Boolean).join(", ") || "-"],
    ["Enquiry Source", reg.enquirySource?.name ?? "-"],
    ["Special Support", reg.specialSupport ? "Yes" : "No"],
    ["Special Details", reg.specialDetails ?? "-"],
    ["Staff Remarks", reg.staffRemarks ?? "-"],
    ["Created", formatDateTime(reg.createdAt)],
    ["Last Updated", formatDateTime(reg.updatedAt)],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/registrations"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h2 className="text-xl font-bold">Registration Detail</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/registrations/${reg.id}/print`}><FileText className="mr-1 h-4 w-4" />Print</Link>
          </Button>
          {reg.status === "REGISTERED" && isWriteAllowed && (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/registrations/${reg.id}/edit`}><Pencil className="mr-1 h-4 w-4" />Edit</Link>
              </Button>
              <CancelRegistrationButton registrationId={reg.id} />
              <StartAdmissionButton registrationId={reg.id} studentName={reg.studentName} />
            </>
          )}
          {reg.status === "ADMISSION_STARTED" && latestAdmission && (
            <Button size="sm" asChild>
              <Link href={`/admissions/${latestAdmission.id}`}>
                <ArrowRight className="mr-1 h-4 w-4" />View Admission
              </Link>
            </Button>
          )}
          {reg.status === "ADMITTED" && latestAdmission && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/admissions/${latestAdmission.id}`}>Admission #{latestAdmission.admissionNo}</Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Registration Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            {fields.map(([label, value]) => (
              <div key={label as string}>
                <dt className="font-medium text-muted-foreground">{label}</dt>
                <dd className="mt-0.5">
                  {label === "Status" ? (
                    <Badge variant={status.variant}>{status.label}</Badge>
                  ) : (
                    <span>{value as string}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
