"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateAdmissionMedical } from "@/features/admissions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

import { useSession } from "next-auth/react";

export function MedicalTab({ admission }: { admission: any }) {
  const { data: session } = useSession();
  const roles = (session?.user as any)?.roles || [];
  const isSysAdminOrTic = roles.includes("SYSTEM_ADMIN") || roles.includes("TIC");
  const isWriteAllowed = isSysAdminOrTic || roles.includes("ADMISSION_STAFF");

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const med = admission.student.medicalProfile;

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      walkingStatus: med?.walkingStatus ?? "",
      speechStatus: med?.speechStatus ?? "",
      hasAllergies: med?.hasAllergies ?? false,
      allergyDetails: med?.allergyDetails ?? "",
      healthIssues: med?.healthIssues ?? "",
      needsMedication: med?.needsMedication ?? false,
      medicationDetails: med?.medicationDetails ?? "",
      specialAttention: med?.specialAttention ?? "",
    },
  });

  const hasAllergies = watch("hasAllergies");
  const needsMedication = watch("needsMedication");

  async function onSubmit(data: any) {
    setLoading(true);
    try {
      await updateAdmissionMedical(admission.id, data);
      toast.success("Medical information saved");
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
        <CardTitle className="text-base">Medical Information</CardTitle>
        {admission.status !== "CANCELLED" && isWriteAllowed && (
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
            <Pencil className="mr-1 h-4 w-4" />{editing ? "Cancel" : "Edit"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!editing ? (
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
            {[
              ["Walking Status", med?.walkingStatus ?? "-"],
              ["Speech Status", med?.speechStatus ?? "-"],
              ["Has Allergies", med?.hasAllergies ? "Yes" : "No"],
              ["Allergy Details", med?.allergyDetails ?? "-"],
              ["Health Issues", med?.healthIssues ?? "-"],
              ["Needs Medication", med?.needsMedication ? "Yes" : "No"],
              ["Medication Details", med?.medicationDetails ?? "-"],
              ["Special Attention Notes", med?.specialAttention ?? "-"],
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
              <div className="space-y-2"><Label>Walking Status *</Label><Input {...register("walkingStatus")} placeholder="Normal / With support / etc." /></div>
              <div className="space-y-2"><Label>Speech Status *</Label><Input {...register("speechStatus")} placeholder="Clear / Delayed / etc." /></div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Checkbox checked={hasAllergies} onCheckedChange={(v) => setValue("hasAllergies", Boolean(v))} />
                <span className="text-sm font-medium">Has Allergies</span>
              </label>
              {hasAllergies && (
                <Textarea {...register("allergyDetails")} rows={2} placeholder="Describe allergies" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Health Issues *</Label>
              <Textarea {...register("healthIssues")} rows={2} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Checkbox checked={needsMedication} onCheckedChange={(v) => setValue("needsMedication", Boolean(v))} />
                <span className="text-sm font-medium">Requires Daily Medication</span>
              </label>
              {needsMedication && (
                <Textarea {...register("medicationDetails")} rows={2} placeholder="Medication details" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Special Attention Notes *</Label>
              <Textarea {...register("specialAttention")} rows={2} />
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
