"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateAdmissionPrevSchool } from "@/features/admissions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

import { useSession } from "next-auth/react";

export function PrevSchoolTab({ admission }: { admission: any }) {
  const { data: session } = useSession();
  const roles = (session?.user as any)?.roles || [];
  const isSysAdminOrTic = roles.includes("SYSTEM_ADMIN") || roles.includes("TIC");
  const isWriteAllowed = isSysAdminOrTic || roles.includes("ADMISSION_STAFF");

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const prev = admission.prevSchool;

  const { register, handleSubmit } = useForm({
    defaultValues: {
      schoolName: prev?.schoolName ?? "",
      schoolAddress: prev?.schoolAddress ?? "",
      lastClassPassed: prev?.lastClassPassed ?? "",
      prevAcademicYear: prev?.prevAcademicYear ?? "",
      tcNumber: prev?.tcNumber ?? "",
      awards: prev?.awards ?? "",
    },
  });

  async function onSubmit(data: any) {
    setLoading(true);
    try {
      await updateAdmissionPrevSchool(admission.id, data);
      toast.success("Previous school details saved");
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Previous School Details</CardTitle>
        {admission.status === "DRAFT" && isWriteAllowed && (
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
            <Pencil className="mr-1 h-4 w-4" />{editing ? "Cancel" : "Edit"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!editing ? (
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
            {[
              ["School Name", prev?.schoolName ?? "-"],
              ["School Address", prev?.schoolAddress ?? "-"],
              ["Last Class Passed", prev?.lastClassPassed ?? "-"],
              ["Previous Academic Year", prev?.prevAcademicYear ?? "-"],
              ["TC Number", prev?.tcNumber ?? "-"],
              ["Awards / Extra-curricular", prev?.awards ?? "-"],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value as string}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>School Name</Label><Input {...register("schoolName")} /></div>
              <div className="space-y-2"><Label>School Address</Label><Input {...register("schoolAddress")} /></div>
              <div className="space-y-2"><Label>Last Class / Std Passed</Label><Input {...register("lastClassPassed")} /></div>
              <div className="space-y-2"><Label>Previous Academic Year</Label><Input {...register("prevAcademicYear")} placeholder="e.g. 2025-26" /></div>
              <div className="space-y-2"><Label>TC Number</Label><Input {...register("tcNumber")} /></div>
            </div>
            <div className="space-y-2">
              <Label>Awards / Extra-curricular</Label>
              <Textarea {...register("awards")} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
