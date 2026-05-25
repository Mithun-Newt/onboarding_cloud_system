"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateAdmissionFamily } from "@/features/admissions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

import { useSession } from "next-auth/react";

export function ParentInfoTab({ admission }: { admission: any }) {
  const { data: session } = useSession();
  const roles = (session?.user as any)?.roles || [];
  const isSysAdminOrTic = roles.includes("SYSTEM_ADMIN") || roles.includes("TIC");
  const isWriteAllowed = isSysAdminOrTic || roles.includes("ADMISSION_STAFF");

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const guardians = admission.student.family?.guardians ?? [];

  const father = guardians.find((g: any) => g.relationship === "FATHER");
  const mother = guardians.find((g: any) => g.relationship === "MOTHER");
  const guardian = guardians.find((g: any) => !["FATHER", "MOTHER"].includes(g.relationship));

  const primaryContact = guardians.find((g: any) => g.isPrimary);
  const primaryType = father?.isPrimary ? "FATHER" : mother?.isPrimary ? "MOTHER" : guardian?.isPrimary ? "GUARDIAN" : "FATHER";

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      fatherName: father?.fullName ?? "",
      fatherMobile: father?.mobile ?? "",
      fatherEmail: father?.email ?? "",
      fatherEducation: father?.education ?? "",
      fatherOccupation: father?.occupation ?? "",
      fatherIncome: father?.annualIncome?.toString() ?? "",
      motherName: mother?.fullName ?? "",
      motherMobile: mother?.mobile ?? "",
      motherEmail: mother?.email ?? "",
      motherEducation: mother?.education ?? "",
      motherOccupation: mother?.occupation ?? "",
      motherIncome: mother?.annualIncome?.toString() ?? "",
      guardianName: guardian?.fullName ?? "",
      guardianRelationship: guardian?.relationship ?? "",
      guardianEducation: guardian?.education ?? "",
      guardianOccupation: guardian?.occupation ?? "",
      primaryContactPerson: primaryType,
    },
  });

  async function onSubmit(data: any) {
    setLoading(true);
    try {
      await updateAdmissionFamily(admission.id, data);
      toast.success("Parent information saved");
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  const View = () => (
    <div className="space-y-6">
      {[
        { title: "Father", data: father },
        { title: "Mother", data: mother },
        { title: "Guardian", data: guardian },
      ].map(({ title, data }) => data ? (
        <div key={title}>
          <h4 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h4>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
            {[
              ["Name", data.fullName],
              ["Mobile", data.mobile ?? "-"],
              ["Email", data.email ?? "-"],
              ["Education", data.education ?? "-"],
              ["Occupation", data.occupation ?? "-"],
              ["Annual Income", data.annualIncome ? `₹${data.annualIncome}` : "-"],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value as string}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null)}
      <div>
        <dt className="text-xs text-muted-foreground">Primary Contact Person</dt>
        <dd className="font-medium">{primaryType}</dd>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Parent / Guardian Information</CardTitle>
        {admission.status === "DRAFT" && isWriteAllowed && (
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
            <Pencil className="mr-1 h-4 w-4" />{editing ? "Cancel" : "Edit"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!editing ? <View /> : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Father */}
            <div>
              <h4 className="mb-3 text-sm font-semibold">Father</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1"><Label>Name</Label><Input {...register("fatherName")} /></div>
                <div className="space-y-1"><Label>Mobile</Label><Input type="tel" {...register("fatherMobile")} /></div>
                <div className="space-y-1"><Label>Email</Label><Input type="email" {...register("fatherEmail")} /></div>
                <div className="space-y-1"><Label>Education</Label><Input {...register("fatherEducation")} /></div>
                <div className="space-y-1"><Label>Occupation</Label><Input {...register("fatherOccupation")} /></div>
                <div className="space-y-1"><Label>Annual Income (₹)</Label><Input type="number" {...register("fatherIncome")} /></div>
              </div>
            </div>
            {/* Mother */}
            <div>
              <h4 className="mb-3 text-sm font-semibold">Mother</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1"><Label>Name</Label><Input {...register("motherName")} /></div>
                <div className="space-y-1"><Label>Mobile</Label><Input type="tel" {...register("motherMobile")} /></div>
                <div className="space-y-1"><Label>Email</Label><Input type="email" {...register("motherEmail")} /></div>
                <div className="space-y-1"><Label>Education</Label><Input {...register("motherEducation")} /></div>
                <div className="space-y-1"><Label>Occupation</Label><Input {...register("motherOccupation")} /></div>
                <div className="space-y-1"><Label>Annual Income (₹)</Label><Input type="number" {...register("motherIncome")} /></div>
              </div>
            </div>
            {/* Guardian */}
            <div>
              <h4 className="mb-3 text-sm font-semibold">Guardian (Optional)</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1"><Label>Name</Label><Input {...register("guardianName")} /></div>
                <div className="space-y-1"><Label>Relationship</Label><Input {...register("guardianRelationship")} /></div>
                <div className="space-y-1"><Label>Education</Label><Input {...register("guardianEducation")} /></div>
                <div className="space-y-1"><Label>Occupation</Label><Input {...register("guardianOccupation")} /></div>
              </div>
            </div>
            {/* Primary Contact */}
            <div className="space-y-2">
              <Label>Primary Contact Person</Label>
              <Select value={watch("primaryContactPerson")} onValueChange={(v) => setValue("primaryContactPerson", v as any)}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FATHER">Father</SelectItem>
                  <SelectItem value="MOTHER">Mother</SelectItem>
                  <SelectItem value="GUARDIAN">Guardian</SelectItem>
                </SelectContent>
              </Select>
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
