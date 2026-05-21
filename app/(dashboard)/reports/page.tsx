import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardList,
  GraduationCap,
  FileText,
  CreditCard,
  Armchair,
  Megaphone,
  HeartPulse,
  Bus,
  School,
  Calendar,
} from "lucide-react";

const reports = [
  { href: "/reports/registration-summary", label: "Registration Summary", description: "All registrations with filters by year, grade, status", icon: ClipboardList },
  { href: "/reports/admission-summary", label: "Admission Summary", description: "Confirmed admissions with student details", icon: GraduationCap },
  { href: "/reports/pending-documents", label: "Pending Documents", description: "Students with missing or unverified documents", icon: FileText },
  { href: "/reports/fee-pending", label: "Fee Pending", description: "Students with outstanding fee payments", icon: CreditCard },
  { href: "/reports/fee-collected", label: "Fee Collected", description: "Summary of all collected payments", icon: CreditCard },
  { href: "/reports/seat-availability", label: "Seat Availability", description: "Available and filled seats per grade", icon: Armchair },
  { href: "/reports/source-wise", label: "Source-wise Enquiries", description: "How families found the school", icon: Megaphone },
  { href: "/reports/previous-school", label: "Previous School", description: "List of previous schools by student", icon: School },
  { href: "/reports/medical-special-support", label: "Special Support", description: "Students requiring special educational support", icon: HeartPulse },
  { href: "/reports/transport", label: "Transport", description: "Bus route and stop assignment report", icon: Bus },
  { href: "/reports/vaccination-pending", label: "Vaccination Pending", description: "Students with pending vaccinations", icon: HeartPulse },
  { href: "/reports/meeting-summary", label: "Meeting Summary", description: "Daily / monthly admissions overview", icon: Calendar },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reports</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-base">{label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
