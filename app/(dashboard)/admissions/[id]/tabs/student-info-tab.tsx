"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { admissionStudentSchema } from "@/lib/validations/admission";
import { updateAdmissionStudent, transliterateEnglishToTamil } from "@/features/admissions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Pencil, Check } from "lucide-react";
import { format } from "date-fns";

import { useSession } from "next-auth/react";

interface Props {
  admission: any;
}

export function StudentInfoTab({ admission }: Props) {
  const { data: session } = useSession();
  const roles = (session?.user as any)?.roles || [];
  const isSysAdminOrTic = roles.includes("SYSTEM_ADMIN") || roles.includes("TIC");
  const isWriteAllowed = isSysAdminOrTic || roles.includes("ADMISSION_STAFF");

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const student = admission.student;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(admissionStudentSchema),
    defaultValues: {
      givenName: student.givenName ?? "",
      surname: student.surname ?? "",
      givenNameTa: student.givenNameTa ?? "",
      surnameTa: student.surnameTa ?? "",
      dateOfBirth: student.dateOfBirth ? format(new Date(student.dateOfBirth), "yyyy-MM-dd") : "",
      gender: student.gender,
      bloodGroup: student.bloodGroup ?? "",
      religion: student.religion ?? "",
      community: student.community ?? "",
      category: student.category ?? "",
      motherTongue: student.motherTongue ?? "",
      nationality: student.nationality ?? "Indian",
      emisNumber: student.emisNumber ?? "",
      aadhaarLast4: student.aadhaarLast4 ?? "",
      address1: student.address1 ?? "",
      address2: student.address2 ?? "",
      city: student.city ?? "",
      state: student.state ?? "",
      pinCode: student.pinCode ?? "",
      referredStudentType: student.referredStudentType ?? "NEW_STUDENT",
      referredStudentName: student.referredStudentName ?? "",
      referredStudentGrade: student.referredStudentGrade ?? "",
    },
  });

  const referredStudentTypeValue = watch("referredStudentType") ?? "NEW_STUDENT";

  const handleTransliterate = async (field: "givenName" | "surname", englishValue: string) => {
    if (!englishValue) return;
    try {
      const tamilValue = await transliterateEnglishToTamil(englishValue);
      if (tamilValue) {
        setValue(field === "givenName" ? "givenNameTa" : "surnameTa", tamilValue, { shouldValidate: true });
      }
    } catch (error) {
      console.error("Transliteration failed", error);
    }
  };


  async function onSubmit(data: any) {
    setLoading(true);
    try {
      await updateAdmissionStudent(admission.id, data);
      toast.success("Student information saved");
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
        <CardTitle className="text-base">Student Information</CardTitle>
        {admission.status !== "CANCELLED" && isWriteAllowed && (
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
            {editing ? <Check className="mr-1 h-4 w-4" /> : <Pencil className="mr-1 h-4 w-4" />}
            {editing ? "Cancel" : "Edit"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!editing ? (
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
            {[
              ["Given Name (English)", student.givenName ?? "-"],
              ["Surname/Family Name (English)", student.surname ?? "-"],
              ["Given Name (Tamil)", student.givenNameTa ?? "-"],
              ["Surname/Family Name (Tamil)", student.surnameTa ?? "-"],
              ["Date of Birth", student.dateOfBirth ? format(new Date(student.dateOfBirth), "dd/MM/yyyy") : "-"],
              ["Gender", student.gender],
              ["Blood Group", student.bloodGroup ?? "-"],
              ["Religion", student.religion ?? "-"],
              ["Community", student.community ?? "-"],
              ["Category", student.category ?? "-"],
              ["Mother Tongue", student.motherTongue ?? "-"],
              ["Nationality", student.nationality ?? "Indian"],
              ["EMIS Number", student.emisNumber ?? "-"],
              ["Aadhaar (last 4)", student.aadhaarLast4 ? `XXXX XXXX ${student.aadhaarLast4}` : "-"],
              ["Address", [student.address1, student.address2, student.city, student.state, student.pinCode].filter(Boolean).join(", ") || "-"],
              ["Connection Type", student.referredStudentType === "SIBLING" ? "Sibling" : student.referredStudentType === "RELATIVE" ? "Relative" : "New Student (No Connection)"],
              ...(student.referredStudentType === "SIBLING" || student.referredStudentType === "RELATIVE" ? [
                ["Referred Student Name", student.referredStudentName ?? "-"],
                ["Referred Student Grade", student.referredStudentGrade ?? "-"],
              ] : []),
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value as string}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Given Name (English) *</Label>
                <Input 
                  {...register("givenName")} 
                  onBlur={(e) => {
                    register("givenName").onBlur(e);
                    handleTransliterate("givenName", e.target.value);
                  }}
                />
                {errors.givenName && <p className="text-xs text-red-500">{(errors.givenName as any).message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Surname/Family Name (English) *</Label>
                <Input 
                  {...register("surname")} 
                  onBlur={(e) => {
                    register("surname").onBlur(e);
                    handleTransliterate("surname", e.target.value);
                  }}
                />
                {errors.surname && <p className="text-xs text-red-500">{(errors.surname as any).message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Given Name (Tamil) *</Label>
                <Input {...register("givenNameTa")} />
                {errors.givenNameTa && <p className="text-xs text-red-500">{(errors.givenNameTa as any).message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Surname/Family Name (Tamil) *</Label>
                <Input {...register("surnameTa")} />
                {errors.surnameTa && <p className="text-xs text-red-500">{(errors.surnameTa as any).message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" {...register("dateOfBirth")} />
                {errors.dateOfBirth && <p className="text-xs text-red-500">{(errors.dateOfBirth as any).message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={watch("gender")} onValueChange={(v) => setValue("gender", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select value={watch("bloodGroup")} onValueChange={(v) => setValue("bloodGroup", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Religion</Label>
                <Input {...register("religion")} />
              </div>
              <div className="space-y-2">
                <Label>Community</Label>
                <Input {...register("community")} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["OC", "BC", "BCM", "MBC", "SC", "ST"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mother Tongue</Label>
                <Input {...register("motherTongue")} />
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input {...register("nationality")} />
              </div>
              <div className="space-y-2">
                <Label>EMIS Number</Label>
                <Input {...register("emisNumber")} />
              </div>
              <div className="space-y-2">
                <Label>Aadhaar Last 4 Digits</Label>
                <Input {...register("aadhaarLast4")} maxLength={4} placeholder="1234" />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label>Address Line 1</Label>
                <Input {...register("address1")} />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label>Address Line 2</Label>
                <Input {...register("address2")} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...register("city")} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input {...register("state")} />
              </div>
              <div className="space-y-2">
                <Label>PIN Code</Label>
                <Input {...register("pinCode")} />
              </div>
              <div className="space-y-2">
                <Label>Referred Student connection?</Label>
                <Select value={watch("referredStudentType") ?? "NEW_STUDENT"} onValueChange={(v) => setValue("referredStudentType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select connection" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW_STUDENT">No one (New Student)</SelectItem>
                    <SelectItem value="SIBLING">Yes, Sibling</SelectItem>
                    <SelectItem value="RELATIVE">Yes, Relative</SelectItem>
                  </SelectContent>
                </Select>
                {errors.referredStudentType && <p className="text-xs text-red-500">{(errors.referredStudentType as any).message}</p>}
              </div>

              {(referredStudentTypeValue === "SIBLING" || referredStudentTypeValue === "RELATIVE") && (
                <>
                  <div className="space-y-2">
                    <Label>Referred Student Name *</Label>
                    <Input {...register("referredStudentName")} placeholder="Enter name" />
                    {errors.referredStudentName && <p className="text-xs text-red-500">{(errors.referredStudentName as any).message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Referred Student Grade / Class *</Label>
                    <Input {...register("referredStudentGrade")} placeholder="e.g. LKG / Grade 2" />
                    {errors.referredStudentGrade && <p className="text-xs text-red-500">{(errors.referredStudentGrade as any).message}</p>}
                  </div>
                </>
              )}
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
