"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  GraduationCap,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  FileCheck,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/registrations", label: "Registrations", icon: ClipboardList },
  { href: "/admissions", label: "Admissions", icon: GraduationCap },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const roles = (session?.user as any)?.roles || [];
  const isSysAdminOrTic = roles.includes("SYSTEM_ADMIN") || roles.includes("TIC");
  const isTransportStaff = roles.includes("TRANSPORT_STAFF");
  const isCashier = roles.includes("CASHIER");

  const filteredItems = navItems.filter((item) => {
    // If not logged in/loading, show basic navigation (to avoid layout shift)
    if (status === "loading" || !session) {
      return item.href !== "/settings";
    }

    if (isSysAdminOrTic) return true;

    if (isTransportStaff) {
      return item.href === "/admissions";
    }

    if (isCashier) {
      return ["/dashboard", "/registrations", "/admissions", "/payments"].includes(item.href);
    }

    // ADMISSION_STAFF and READ_ONLY_MANAGEMENT see everything except settings
    if (item.href === "/settings") {
      return false;
    }

    return true;
  });

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-white">
      {/* Logo & School Name */}
      <div className="flex h-20 items-center border-b px-4 bg-gradient-to-r from-green-50 to-blue-50">
        <img
          src="/logo/appu-arivaalayem-logo.png"
          alt={process.env.NEXT_PUBLIC_SCHOOL_NAME}
          className="mr-3 h-12 w-12 object-contain"
        />
        <div className="flex-1">
          <p className="text-sm font-bold leading-tight text-green-700">
            {process.env.NEXT_PUBLIC_SCHOOL_NAME || "Appu Arivaalayem"}
          </p>
          <p className="text-xs text-gray-600">Student Onboarding Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filteredItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-3 py-3">
        <p className="text-xs text-gray-400 text-center">v1.0.0 — Staff Only</p>
      </div>
    </aside>
  );
}
