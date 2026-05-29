import { prisma } from "@/lib/prisma";
import { RegistrationForm } from "../registration-form";

export const dynamic = "force-dynamic";

export default async function NewRegistrationPage() {
  const [academicYears, grades, campuses, enquirySources] = await Promise.all([
    prisma.academicYear.findMany({ where: { isActive: true }, orderBy: { startYear: "desc" } }),
    prisma.grade.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.campus.findMany({ where: { isActive: true } }),
    prisma.enquirySource.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const currentYear = academicYears.find((y) => y.isCurrent);
  const defaultCampus = campuses[0];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">New Registration</h2>
      <RegistrationForm
        academicYears={academicYears}
        grades={grades}
        campuses={campuses}
        enquirySources={enquirySources}
        defaults={{
          academicYearId: currentYear?.id,
          campusId: defaultCampus?.id,
          staffRemarks: "NONE",
        }}
      />
    </div>
  );
}
