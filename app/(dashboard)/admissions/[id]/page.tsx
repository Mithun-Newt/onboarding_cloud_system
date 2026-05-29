import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, CheckCircle, XCircle } from "lucide-react";
import { StudentInfoTab } from "./tabs/student-info-tab";
import { ParentInfoTab } from "./tabs/parent-info-tab";
import { PrevSchoolTab } from "./tabs/prev-school-tab";
import { MedicalTab } from "./tabs/medical-tab";
import { DocumentsTab } from "./tabs/documents-tab";
import { PaymentsTab } from "./tabs/payments-tab";
import { TransportTab } from "./tabs/transport-tab";
import { ConfirmAdmissionButton } from "./confirm-button";
import { CancelAdmissionButton } from "./cancel-button";
import { IssueTCButton } from "./tc-button";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STATUS_BADGES: Record<string, { label: string; variant: any }> = {
  DRAFT: { label: "Draft", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  TC_ISSUED: { label: "TC Issued", variant: "destructive" },
};

export default async function AdmissionDetailPage({ params }: { params: { id: string } }) {
  const admission = await prisma.admissionApplication.findUnique({
    where: { id: params.id },
    include: {
      grade: true,
      academicYear: true,
      campus: true,
      student: {
        include: {
          family: { include: { guardians: true } },
          medicalProfile: true,
          vaccinations: { include: { vaccine: true } },
          siblingsRelatives: true,
          documents: { include: { documentType: true, uploadedBy: { select: { fullName: true } } } },
        },
      },
      registration: { select: { registrationNo: true, id: true } },
      prevSchool: true,
      transportReq: { include: { route: true, stop: true } },
      payments: { include: { collectedBy: { select: { fullName: true } } }, orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { changedAt: "asc" } },
      tc: true,
    },
  });

  if (!admission) notFound();

  const session = await getSession();
  const roles = (session?.user as any)?.roles || [];
  const isSysAdminOrTic = roles.includes("SYSTEM_ADMIN") || roles.includes("TIC");
  const isTransportStaff = roles.includes("TRANSPORT_STAFF");
  const isCashier = roles.includes("CASHIER");
  const isWriteAllowed = isSysAdminOrTic || roles.includes("ADMISSION_STAFF");

  const [documentTypes, busRoutes] = await Promise.all([
    prisma.documentType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.busRoute.findMany({ where: { isActive: true }, include: { busStops: true }, orderBy: { routeNo: "asc" } }),
  ]);

  const status = STATUS_BADGES[admission.status] ?? { label: admission.status, variant: "outline" };
  const hasPendingDocs = admission.student.documents.some(
    (d: any) => d.documentType.isRequired && ["NOT_RECEIVED", "UPLOADED", "REJECTED"].includes(d.status)
  );
  const badgeVariant = admission.status === "CONFIRMED" && hasPendingDocs ? "brown" : status.variant;

  const allTabs = [
    { value: "student", label: "Student", content: <StudentInfoTab admission={admission} /> },
    { value: "parents", label: "Parents", content: <ParentInfoTab admission={admission} /> },
    { value: "school", label: "Prev School", content: <PrevSchoolTab admission={admission} /> },
    { value: "medical", label: "Medical", content: <MedicalTab admission={admission} /> },
    { value: "documents", label: "Documents", content: <DocumentsTab admission={admission} documentTypes={documentTypes} /> },
    { value: "transport", label: "Transport", content: <TransportTab admission={admission} busRoutes={busRoutes} /> },
    { value: "payments", label: "Fees & Payments", content: <PaymentsTab admission={admission} /> },
    { value: "history", label: "History", content: (
      <Card>
        <CardHeader><CardTitle className="text-base">Status History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {admission.statusHistory.map((h) => (
              <div key={h.id} className="flex items-center gap-3 text-sm">
                <div className="text-muted-foreground text-xs w-32 shrink-0">{formatDate(h.changedAt)}</div>
                <div>
                  {h.fromStatus && <span className="text-muted-foreground">{h.fromStatus} →{" "}</span>}
                  <span className="font-medium">{h.toStatus}</span>
                  {h.reason && <span className="text-muted-foreground ml-2">({h.reason})</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ) },
  ];

  const enabledTabs = allTabs.filter((t) => {
    if (isTransportStaff) return t.value === "transport";
    if (isCashier) return t.value !== "documents";
    return true;
  });

  const defaultTab = isTransportStaff ? "transport" : "student";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 no-print">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admissions"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold">
            {admission.admissionNo ? `Admission ${admission.admissionNo}` : "Admission (Draft)"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Reg: <Link href={`/registrations/${admission.registration.id}`} className="text-blue-600 hover:underline">{admission.registration.registrationNo}</Link>
            {" · "}{admission.grade.name}{" · "}{admission.academicYear.label}
          </p>
        </div>
        <Badge variant={badgeVariant} className="ml-2">{status.label}</Badge>
        <div className="ml-auto flex gap-2">
          {admission.status === "DRAFT" && isWriteAllowed && (
            <>
              <CancelAdmissionButton admissionId={admission.id} />
              <ConfirmAdmissionButton admissionId={admission.id} />
            </>
          )}
          {admission.status === "CONFIRMED" && isWriteAllowed && (
            <IssueTCButton admission={admission} />
          )}
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admissions/${admission.id}/print`}><Printer className="mr-1 h-4 w-4" />Print</Link>
          </Button>
        </div>
      </div>

      {admission.status === "TC_ISSUED" && admission.tc && (
        <Card className="border-red-200 bg-red-50 text-red-900 no-print">
          <CardContent className="p-4">
            <h3 className="font-bold text-sm text-red-800">Transfer Certificate (TC) Issued</h3>
            <p className="text-xs text-red-700 mt-0.5">
              This student has exited the school. Their strength contribution has been removed from the current academic year.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1.5 gap-x-4 mt-3 text-xs text-red-800 border-t border-red-200/50 pt-2.5">
              <div><strong>TC Number:</strong> {admission.tc.tcNumber}</div>
              <div><strong>Date of Exit:</strong> {formatDate(admission.tc.tcDate)}</div>
              <div><strong>Destination School:</strong> {admission.tc.destinationSchool}</div>
              <div className="sm:col-span-3"><strong>Reason for Exit:</strong> {admission.tc.reason}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex-wrap h-auto gap-1 no-print">
          {enabledTabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {enabledTabs.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            {t.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
