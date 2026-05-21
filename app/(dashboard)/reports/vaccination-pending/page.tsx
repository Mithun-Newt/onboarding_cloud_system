import { prisma } from "@/lib/prisma";
import { ReportLayout } from "@/components/reports/report-layout";

export const dynamic = "force-dynamic";

export default async function VaccinationPendingPage() {
  const vaccinations = await prisma.studentVaccination.findMany({
    where: { status: { not: "DONE" } },
    include: {
      student: { select: { fullNameEn: true } },
      vaccine: true,
    },
  });

  return (
    <ReportLayout title="Vaccination Pending" csvData={vaccinations.map((v) => ({ Student: v.student.fullNameEn, Vaccine: v.vaccine.name, Status: v.status }))} csvFilename="vaccination-pending.csv">
      <div className="rounded-lg border bg-white overflow-x-auto text-sm">
        <div className="px-4 py-2 border-b text-xs text-muted-foreground">{vaccinations.length} pending vaccinations</div>
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Vaccine</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {vaccinations.map((v) => (
              <tr key={v.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{v.student.fullNameEn}</td>
                <td className="px-4 py-3">{v.vaccine.name}</td>
                <td className="px-4 py-3">{v.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  );
}
