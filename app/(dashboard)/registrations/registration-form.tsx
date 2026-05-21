"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema, RegistrationInput } from "@/lib/validations/registration";
import { createRegistration, updateRegistration } from "@/features/registrations/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import type { AcademicYear, Grade, Campus, EnquirySource } from "@prisma/client";

interface Props {
  academicYears: AcademicYear[];
  grades: Grade[];
  campuses: Campus[];
  enquirySources: EnquirySource[];
  defaults?: Partial<RegistrationInput>;
  registrationId?: string;
  initialValues?: Partial<RegistrationInput>;
}

export function RegistrationForm({
  academicYears,
  grades,
  campuses,
  enquirySources,
  defaults,
  registrationId,
  initialValues,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { ...defaults, ...initialValues, specialSupport: initialValues?.specialSupport ?? false },
  });

  const specialSupport = watch("specialSupport");

  async function onSubmit(data: RegistrationInput) {
    setLoading(true);
    try {
      if (registrationId) {
        await updateRegistration(registrationId, data);
        toast.success("Registration updated");
        router.push(`/registrations/${registrationId}`);
      } else {
        const reg = await createRegistration(data);
        toast.success(`Registration created: ${reg.registrationNo}`);
        router.push(`/registrations/${reg.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save registration");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Academic Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Academic Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Academic Year *</Label>
            <Select
              value={watch("academicYearId")}
              onValueChange={(v) => setValue("academicYearId", v)}
            >
              <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.academicYearId && <p className="text-xs text-red-500">{errors.academicYearId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Campus *</Label>
            <Select value={watch("campusId")} onValueChange={(v) => setValue("campusId", v)}>
              <SelectTrigger><SelectValue placeholder="Select campus" /></SelectTrigger>
              <SelectContent>
                {campuses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Applied Grade *</Label>
            <Select value={watch("gradeId")} onValueChange={(v) => setValue("gradeId", v)}>
              <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
              <SelectContent>
                {grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.gradeId && <p className="text-xs text-red-500">{errors.gradeId.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Student Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Student Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-2">
            <Label>Student Full Name *</Label>
            <Input {...register("studentName")} />
            {errors.studentName && <p className="text-xs text-red-500">{errors.studentName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Date of Birth *</Label>
            <Input type="date" {...register("dateOfBirth")} />
            {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Gender *</Label>
            <Select value={watch("gender")} onValueChange={(v) => setValue("gender", v as any)}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Previous School Name</Label>
            <Input {...register("prevSchoolName")} placeholder="If applicable" />
          </div>
        </CardContent>
      </Card>

      {/* Parent / Contact */}
      <Card>
        <CardHeader><CardTitle className="text-base">Parent & Contact Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Father Name</Label>
            <Input {...register("fatherName")} />
          </div>
          <div className="space-y-2">
            <Label>Father Mobile</Label>
            <Input {...register("fatherMobile")} type="tel" />
          </div>
          <div className="space-y-2">
            <Label>Mother Name</Label>
            <Input {...register("motherName")} />
          </div>
          <div className="space-y-2">
            <Label>Mother Mobile</Label>
            <Input {...register("motherMobile")} type="tel" />
          </div>
          <div className="space-y-2">
            <Label>Primary Contact Number</Label>
            <Input {...register("primaryContact")} type="tel" />
          </div>
          {errors.primaryContact && (
            <div className="sm:col-span-2 flex items-center gap-2 text-xs text-red-500">
              <AlertTriangle className="h-4 w-4" />
              {errors.primaryContact.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Additional Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Enquiry / Reference Source</Label>
            <Select value={watch("enquirySourceId") ?? ""} onValueChange={(v) => setValue("enquirySourceId", v || undefined)}>
              <SelectTrigger><SelectValue placeholder="How did they hear about us?" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Not specified</SelectItem>
                {enquirySources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Special Educational Support Required</Label>
            <label className="flex items-center gap-2 pt-2">
              <Checkbox
                checked={specialSupport}
                onCheckedChange={(v) => setValue("specialSupport", Boolean(v))}
              />
              <span className="text-sm">Yes, special support needed</span>
            </label>
          </div>

          {specialSupport && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Special Support Details *</Label>
              <Textarea {...register("specialDetails")} rows={3} />
              {errors.specialDetails && <p className="text-xs text-red-500">{errors.specialDetails.message}</p>}
            </div>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label>Staff Remarks</Label>
            <Textarea {...register("staffRemarks")} rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {registrationId ? "Update Registration" : "Create Registration"}
        </Button>
      </div>
    </form>
  );
}
