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
import { ConfirmAdmissionButton } from "./confirm-button";
import { CancelAdmissionButton } from "./cancel-button";

export const dynamic = "force-dynamic";

const STATUS_BADGES: Record<string, { label: string; variant: any }> = {
  DRAFT: { label: "Draft", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
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
    },
  });

  if (!admission) notFound();

  const documentTypes = await prisma.documentType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  const status = STATUS_BADGES[admission.status] ?? { label: admission.status, variant: "outline" };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
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
        <Badge variant={status.variant} className="ml-2">{status.label}</Badge>
        <div className="ml-auto flex gap-2">
          {admission.status === "DRAFT" && (
            <>
              <CancelAdmissionButton admissionId={admission.id} />
              <ConfirmAdmissionButton admissionId={admission.id} />
            </>
          )}
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admissions/${admission.id}/print`}><Printer className="mr-1 h-4 w-4" />Print</Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="student">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="student">Student</TabsTrigger>
          <TabsTrigger value="parents">Parents</TabsTrigger>
          <TabsTrigger value="school">Prev School</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="payments">Fees & Payments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          <StudentInfoTab admission={admission} />
        </TabsContent>
        <TabsContent value="parents">
          <ParentInfoTab admission={admission} />
        </TabsContent>
        <TabsContent value="school">
          <PrevSchoolTab admission={admission} />
        </TabsContent>
        <TabsContent value="medical">
          <MedicalTab admission={admission} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab admission={admission} documentTypes={documentTypes} />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsTab admission={admission} />
        </TabsContent>
        <TabsContent value="history">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
