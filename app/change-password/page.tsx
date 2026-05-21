"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Loader2, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { toast } from "sonner";

export default function ChangePasswordPage() {
  const { data: session, update } = useSession();

  const [loading, setLoading] =
    useState(false);

  const [current, setCurrent] =
    useState("");

  const [next, setNext] =
    useState("");

  const [confirm, setConfirm] =
    useState("");

  async function handleSubmit(
    e?: React.FormEvent
  ) {
    if (e) {
      e.preventDefault();
    }

    if (next !== confirm) {
      toast.error(
        "New passwords do not match"
      );

      return;
    }

    if (next.length < 8) {
      toast.error(
        "Password must be at least 8 characters"
      );

      return;
    }

    setLoading(true);

    try {
      console.log(
        "CALLING CHANGE PASSWORD API"
      );

      const res = await fetch(
        "/api/staff/change-password",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            currentPassword: current,
            newPassword: next,
          }),
        }
      );

      console.log("FETCH RESPONSE:", res);

      const data = await res.json();

      console.log("FETCH DATA:", data);

      if (!res.ok) {
        toast.error(
          data.error ||
            "Failed to change password"
        );

        return;
      }

      toast.success(
        "Password changed successfully"
      );

      // Refresh session to get updated mustChangePassword status
      await update();

      // Sign out and redirect to login
      await signOut({
        redirect: true,
        callbackUrl: "/login",
      });
    } catch (err) {
      console.log("FRONTEND ERROR:", err);

      toast.error(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-600" />

            <CardTitle>
              Change Password
            </CardTitle>
          </div>

          {(session?.user as any)
            ?.mustChangePassword && (
            <CardDescription className="font-medium text-orange-600">
              You must change your
              default password before
              continuing.
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label>
                Current Password
              </Label>

              <Input
                type="password"
                value={current}
                onChange={(e) =>
                  setCurrent(
                    e.target.value
                  )
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>
                New Password
              </Label>

              <Input
                type="password"
                value={next}
                onChange={(e) =>
                  setNext(
                    e.target.value
                  )
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Confirm New Password
              </Label>

              <Input
                type="password"
                value={confirm}
                onChange={(e) =>
                  setConfirm(
                    e.target.value
                  )
                }
                required
                disabled={loading}
              />
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full"
              disabled={loading}
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}