import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RegistrationForm } from "../../registration-form";
import { format } from "date-fns";
import { splitFullName, getEligibleGradeName } from "@/lib/utils";

export default async function EditRegistrationPage({ params }: { params: { id: string } }) {
  const reg = await prisma.registration.findUnique({
    where: { id: params.id },
    include: { academicYear: true, grade: true, campus: true },
  });
  if (!reg) notFound();
  if (reg.status !== "REGISTERED") {
    return (
      <div className="rounded-lg border bg-amber-50 p-6 text-amber-700">
        <p className="font-medium">Cannot edit this registration</p>
        <p className="text-sm">Registrations with status {reg.status} cannot be edited.</p>
      </div>
    );
  }

  const { firstName, middleName, lastName } = splitFullName(reg.studentName);
  const eligibleGrade = getEligibleGradeName(reg.dateOfBirth, reg.academicYear.startYear);
  const isRelaxed = reg.grade.name !== eligibleGrade;

  const [academicYears, grades, campuses, enquirySources] = await Promise.all([
    prisma.academicYear.findMany({ where: { isActive: true }, orderBy: { startYear: "desc" } }),
    prisma.grade.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.campus.findMany({ where: { isActive: true } }),
    prisma.enquirySource.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Edit Registration — {reg.registrationNo}</h2>
      <RegistrationForm
        academicYears={academicYears}
        grades={grades}
        campuses={campuses}
        enquirySources={enquirySources}
        registrationId={reg.id}
        initialValues={{
          academicYearId: reg.academicYearId,
          campusId: reg.campusId,
          gradeId: reg.gradeId,
          firstName,
          middleName,
          lastName,
          ageRelaxation: isRelaxed,
          dateOfBirth: format(new Date(reg.dateOfBirth), "yyyy-MM-dd"),
          gender: reg.gender,
          fatherName: reg.fatherName ?? "",
          fatherMobile: reg.fatherMobile ?? "",
          motherName: reg.motherName ?? "",
          motherMobile: reg.motherMobile ?? "",
          primaryContact: reg.primaryContact ?? "",
          prevSchoolName: reg.prevSchoolName ?? "",
          address1: reg.address1 ?? "",
          address2: reg.address2 ?? "",
          city: reg.city ?? "",
          state: reg.state ?? "",
          pinCode: reg.pinCode ?? "",
          enquirySourceId: reg.enquirySourceId ?? "",
          specialSupport: reg.specialSupport,
          specialDetails: reg.specialDetails ?? "",
          staffRemarks: reg.staffRemarks ?? "",
        }}
      />
    </div>
  );
}

