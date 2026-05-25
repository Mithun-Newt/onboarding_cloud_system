"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { createStaffUser } from "@/features/settings/actions";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_ROLES = [
  "SYSTEM_ADMIN",
  "TIC",
  "ADMISSION_STAFF",
  "CASHIER",
  "TRANSPORT_STAFF",
  "READ_ONLY_MANAGEMENT",
];

export function CreateUserForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["ADMISSION_STAFF"]);

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedRoles.length === 0) {
      toast.error("Select at least one role");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createStaffUser({
        username: fd.get("username") as string,
        fullName: fd.get("fullName") as string,
        email: fd.get("email") as string,
        phone: fd.get("phone") as string,
        password: fd.get("password") as string,
        roles: selectedRoles,
      });
      toast.success("Staff user created — they must change password on first login");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1 h-4 w-4" />Add Staff</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create Staff User</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input name="fullName" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input name="username" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input name="phone" disabled={loading} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Temporary Password *</Label>
            <Input name="password" type="text" required disabled={loading} placeholder="User must change this on first login" />
          </div>
          <div className="space-y-2">
            <Label>Roles *</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLES.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedRoles.includes(r)}
                    onCheckedChange={() => toggleRole(r)}
                    disabled={loading}
                  />
                  {r.replace(/_/g, " ")}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
