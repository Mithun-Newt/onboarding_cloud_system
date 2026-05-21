"use client";

import { Button } from "@/components/ui/button";
import { toggleStaffUserActive, resetStaffPassword } from "@/features/settings/actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  user: { id: string; isActive: boolean; username: string };
}

export function UserActions({ user }: Props) {
  async function handleToggle() {
    try {
      await toggleStaffUserActive(user.id, !user.isActive);
      toast.success(`User ${user.isActive ? "deactivated" : "activated"}`);
    } catch {
      toast.error("Failed to update user");
    }
  }

  async function handleResetPassword() {
    const newPwd = prompt("Enter new temporary password:");
    if (!newPwd || newPwd.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await resetStaffPassword(user.id, newPwd);
      toast.success("Password reset — user must change on next login");
    } catch {
      toast.error("Failed to reset password");
    }
  }

  return (
    <div className="flex gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant={user.isActive ? "destructive" : "outline"}>
            {user.isActive ? "Deactivate" : "Activate"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{user.isActive ? "Deactivate" : "Activate"} User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will {user.isActive ? "prevent" : "allow"} {user.username} from logging in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button size="sm" variant="outline" onClick={handleResetPassword}>
        Reset Password
      </Button>
    </div>
  );
}
