import { getDashboardStats, getCurrentAcademicYear } from "@/features/dashboard/queries";
import { getCohortStrengths } from "@/features/dashboard/cohort-actions";
import { getSession } from "@/lib/auth";
import { CohortTable } from "./cohort-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardList,
  GraduationCap,
  FileText,
  CreditCard,
  HeartPulse,
  Bus,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { RegistrationsByGradeChart } from "./registrations-chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const academicYear = await getCurrentAcademicYear();
  const stats = await getDashboardStats(academicYear?.id);

  const initialStrengths = academicYear?.id
    ? await getCohortStrengths(academicYear.id)
    : [];

  const session = await getSession();
  const roles = (session?.user as any)?.roles || [];
  const isWriteAllowed = roles.includes("SYSTEM_ADMIN") || roles.includes("TIC") || roles.includes("ADMISSION_STAFF");

  const kpiCards = [
    {
      label: "Today's Registrations",
      value: stats.todayRegistrations,
      icon: ClipboardList,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Today's Admissions",
      value: stats.todayConfirmed,
      icon: GraduationCap,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Pending Documents",
      value: stats.pendingDocuments,
      icon: FileText,
      color: "text-orange-600 bg-orange-50",
    },
    {
      label: "Fee Pending",
      value: stats.feePending,
      icon: CreditCard,
      color: "text-red-600 bg-red-50",
    },
    {
      label: "Special Support",
      value: stats.specialSupport,
      icon: HeartPulse,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Transport Required",
      value: stats.transportRequired,
      icon: Bus,
      color: "text-teal-600 bg-teal-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">
            Academic Year: <span className="font-medium">{academicYear?.label ?? "Not set"}</span>
            {" · "}Today: {formatDate(new Date())}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className={`mb-2 inline-flex rounded-lg p-2 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grade stats + Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Class-wise Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Class-wise Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Grade</th>
                    <th className="pb-2 pr-4 font-medium text-right">Registrations</th>
                    <th className="pb-2 pr-4 font-medium text-right">Admissions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.gradeStats.map((g) => (
                    <tr key={g.grade} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{g.grade}</td>
                      <td className="py-2 pr-4 text-right text-blue-600">{g.registrations}</td>
                      <td className="py-2 pr-4 text-right text-green-600">{g.admissions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Seat Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seat Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.seatInfo.map((s) => (
                <div key={s.grade}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{s.grade}</span>
                    <span className="text-muted-foreground">
                      {s.filled}/{s.total} filled ·{" "}
                      {s.remainingVacancy < 0 ? (
                        <span className="text-amber-600 font-semibold">
                          {Math.abs(s.remainingVacancy)} exceeded
                        </span>
                      ) : s.remainingVacancy === 0 ? (
                        <span className="text-amber-600 font-semibold">
                          0 open (Full)
                        </span>
                      ) : (
                        <span className="text-green-600 font-semibold">
                          {s.remainingVacancy} open
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-100 flex overflow-hidden">
                    {s.isExceeded ? (
                      <div
                        className="h-full bg-amber-500 transition-all"
                        style={{ width: `${Math.min(100, (s.filled / s.total) * 100)}%` }}
                      />
                    ) : (
                      <>
                        {s.filled > 0 && (
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${Math.min(100, (s.filled / s.total) * 100)}%` }}
                          />
                        )}
                        {s.remainingVacancy > 0 && (
                          <div
                            className="h-full bg-red-500 transition-all"
                            style={{ width: `${Math.min(100, (s.remainingVacancy / s.total) * 100)}%` }}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Strength Flow Section */}
      <CohortTable
        initialStrengths={initialStrengths}
        academicYearId={academicYear?.id ?? ""}
        isWriteAllowed={isWriteAllowed}
        dbConfirmedCounts={stats.dbConfirmedCounts}
      />

      {/* Source-wise enquiries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source-wise Enquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {stats.sourceStats.map((s) => (
              <div key={s.source} className="rounded-lg border bg-gray-50 px-4 py-3 text-center">
                <p className="text-xl font-bold text-blue-600">{s.count}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.source}</p>
              </div>
            ))}
            {stats.sourceStats.length === 0 && (
              <p className="text-sm text-muted-foreground">No enquiry data yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
