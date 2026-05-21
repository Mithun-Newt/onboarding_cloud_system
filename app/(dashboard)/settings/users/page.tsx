import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CreateUserForm } from "./create-user-form";
import { UserActions } from "./user-actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.staffUser.findMany({
    include: { staffUserRoles: { include: { role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Staff Users</h2>
        <CreateUserForm />
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Roles</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last Login</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{u.fullName}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.username}</td>
                <td className="px-4 py-3">{u.email ?? "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.staffUserRoles.map((r) => (
                      <Badge key={r.id} variant="secondary" className="text-xs">
                        {r.role.name.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {u.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Inactive</Badge>}
                </td>
                <td className="px-4 py-3">{formatDate(u.lastLoginAt)}</td>
                <td className="px-4 py-3">
                  <UserActions user={{ id: u.id, isActive: u.isActive, username: u.username }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
