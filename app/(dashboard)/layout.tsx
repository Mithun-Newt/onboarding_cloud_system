import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 flex flex-1 flex-col">
        <Topbar />
        <main className="mt-16 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
