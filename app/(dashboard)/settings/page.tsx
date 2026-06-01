import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, GraduationCap, Armchair, FileText, Megaphone, Users, HardDrive, Settings2 } from "lucide-react";

const settingsLinks = [
  { href: "/settings/academic-years", label: "Academic Years", description: "Manage school years and set the current year", icon: CalendarDays },
  { href: "/settings/grades", label: "Grades / Classes", description: "Configure available grades and their sort order", icon: GraduationCap },
  { href: "/settings/document-types", label: "Document Types", description: "Define required and optional admission documents", icon: FileText },
  { href: "/settings/enquiry-sources", label: "Enquiry Sources", description: "Manage how families hear about the school", icon: Megaphone },
  { href: "/settings/users", label: "Staff Users", description: "Create and manage staff accounts and roles", icon: Users },
  { href: "/settings/backup", label: "Backup & Restore", description: "Download database backup", icon: HardDrive },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings2 className="h-6 w-6 text-gray-600" />
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.map(({ href, label, description, icon: Icon }) => (
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
