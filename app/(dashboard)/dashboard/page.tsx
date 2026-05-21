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
