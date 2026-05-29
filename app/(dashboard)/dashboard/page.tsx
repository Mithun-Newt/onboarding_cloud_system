import { getDashboardStats, getCurrentAcademicYear } from "@/features/dashboard/queries";
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
                      {s.admitted}/{s.total} filled · <span className="text-green-600">{s.available} open</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: s.total > 0 ? `${Math.min(100, (s.admitted / s.total) * 100)}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Strength Flow Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Grade Cohort Strength Flow</span>
            <span className="text-xs font-normal text-muted-foreground">Flow chart from {stats.prevYearLabel} to {stats.currentYearLabel}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b text-left text-xs font-semibold text-slate-700">
                  <th className="px-4 py-3 font-semibold">Classes / Cohort</th>
                  <th className="px-4 py-3 font-semibold text-right bg-blue-50/40 text-blue-900">Strength in {stats.prevYearLabel}</th>
                  <th className="px-4 py-3 font-semibold text-right bg-red-50/40 text-red-900">TC Exits</th>
                  <th className="px-4 py-3 font-semibold text-right bg-amber-50/40 text-amber-900">Actual Strength</th>
                  <th className="px-4 py-3 font-semibold text-right bg-green-50/40 text-green-900">New Admission</th>
                  <th className="px-4 py-3 font-semibold text-right bg-blue-50/80 text-blue-950 font-bold border-l">Strength in {stats.currentYearLabel}</th>
                </tr>
              </thead>
              <tbody>
                {stats.cohortStats.map((item: any) => (
                  <tr key={item.label} className="border-b hover:bg-slate-50/50 transition-colors last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.label}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700 bg-blue-50/10">{item.prevStrength}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600 bg-red-50/10">{item.tc > 0 ? `-${item.tc}` : 0}</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-700 bg-amber-50/10">{item.actualStrength}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700 bg-green-50/10">{item.newAdmission > 0 ? `+${item.newAdmission}` : 0}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 bg-blue-50/20 border-l">{item.currentStrength}</td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-200">
                  <td className="px-4 py-3 text-left">Total</td>
                  <td className="px-4 py-3 text-right text-blue-800">
                    {stats.cohortStats.reduce((sum: number, item: any) => sum + item.prevStrength, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-700">
                    -{stats.cohortStats.reduce((sum: number, item: any) => sum + item.tc, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-800">
                    {stats.cohortStats.reduce((sum: number, item: any) => sum + item.actualStrength, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-800">
                    +{stats.cohortStats.reduce((sum: number, item: any) => sum + item.newAdmission, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-950 font-extrabold border-l">
                    {stats.cohortStats.reduce((sum: number, item: any) => sum + item.currentStrength, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
