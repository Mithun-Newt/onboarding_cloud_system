"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema, RegistrationInput } from "@/lib/validations/registration";
import { createRegistration, updateRegistration } from "@/features/registrations/actions";
import { transliterateEnglishToTamil } from "@/features/admissions/actions";
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
import { calculateAgeToday } from "@/lib/utils";


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
  const [ageError, setAgeError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { ...defaults, ...initialValues, specialSupport: initialValues?.specialSupport ?? false },
  });

  const specialSupport = watch("specialSupport");

  const handleTransliterateAddress = async (field: "address1" | "address2" | "city", englishValue: string) => {
    if (!englishValue) return;
    try {
      const tamilValue = await transliterateEnglishToTamil(englishValue);
      if (tamilValue) {
        setValue(`${field}Ta` as any, tamilValue, { shouldValidate: true });
      }
    } catch (error) {
      console.error("Transliteration failed", error);
    }
  };
  const dobValue = watch("dateOfBirth");
  const academicYearIdValue = watch("academicYearId");
  const ageRelaxationValue = watch("ageRelaxation") ?? false;
  const referredStudentTypeValue = watch("referredStudentType") ?? "NEW_STUDENT";

  const dobParts = dobValue ? dobValue.split("-") : [];
  const isValidDob = !!(dobValue && dobParts.length === 3 && !isNaN(new Date(parseInt(dobParts[0], 10), parseInt(dobParts[1], 10) - 1, parseInt(dobParts[2], 10)).getTime()));

  const birthMonth = isValidDob ? parseInt(dobParts[1], 10) : null;
  const isWithinWindow = birthMonth !== null && (birthMonth === 4 || birthMonth === 5 || birthMonth === 6);

  const getGradeForAge = (age: number) => {
    if (age === 3) return "KG 1 (PRE-KG)";
    if (age === 4) return "KG 2 (JKG)";
    if (age === 5) return "KG 3 (SKG)";
    if (age === 6) return "Grade 1 - YAAZH";
    if (age === 7) return "Grade 2 (YAAZH & VEENAI)";
    if (age === 8) return "Grade 3";
    if (age === 9) return "Grade 4";
    if (age === 10) return "Grade 5 Yaazh";
    if (age === 11) return "Grade 6";
    if (age === 12) return "Grade 7";
    if (age === 13) return "Grade 8";
    if (age === 14) return "Grade 9";
    if (age === 15) return "Grade 10";
    if (age === 16) return "Grade 11";
    if (age >= 17) return "12 Bio/Math";
    return null;
  };

  const eligibilityFeedback = (() => {
    if (!isValidDob || !academicYearIdValue) return null;
    const selectedYear = academicYears.find((y) => y.id === academicYearIdValue);
    if (!selectedYear) return null;
    const startYear = selectedYear.startYear;

    const dobPartsInternal = dobValue.split("-");
    const dob = new Date(parseInt(dobPartsInternal[0], 10), parseInt(dobPartsInternal[1], 10) - 1, parseInt(dobPartsInternal[2], 10));

    // Calculate standard age (March 31 target)
    const standardTargetDate = new Date(startYear, 2, 31);
    let standardAge = standardTargetDate.getFullYear() - dob.getFullYear();
    const standardM = standardTargetDate.getMonth() - dob.getMonth();
    if (standardM < 0 || (standardM === 0 && standardTargetDate.getDate() < dob.getDate())) {
      standardAge--;
    }

    // Calculate relaxation age (June 30 target)
    const relaxationTargetDate = new Date(startYear, 5, 30);
    let relaxationAge = relaxationTargetDate.getFullYear() - dob.getFullYear();
    const relaxationM = relaxationTargetDate.getMonth() - dob.getMonth();
    if (relaxationM < 0 || (relaxationM === 0 && relaxationTargetDate.getDate() < dob.getDate())) {
      relaxationAge--;
    }

    const standardGrade = getGradeForAge(standardAge);
    const relaxationGrade = getGradeForAge(relaxationAge);

    const standardEligible = standardAge >= 3;
    const relaxationEligible = relaxationAge >= 3;

    if (standardEligible) {
      if (isWithinWindow && relaxationGrade && standardGrade !== relaxationGrade) {
        if (ageRelaxationValue) {
          return `This Date of Birth is suitable for ${relaxationGrade} with age relaxation applied, as per CBSE (NEP 2023) age policy.`;
        }
        return `This Date of Birth is perfect for ${standardGrade}, as per CBSE (NEP 2023) age policy. Age relaxation can be applied to change the grade to ${relaxationGrade}.`;
      }
      return `This Date of Birth is perfect for admission to ${standardGrade || "suitable grade"}, as per CBSE (NEP 2023) age policy.`;
    }

    if (relaxationEligible && isWithinWindow) {
      if (ageRelaxationValue && relaxationGrade) {
        return `This Date of Birth is suitable for ${relaxationGrade} with age relaxation applied, as per CBSE (NEP 2023) age policy.`;
      }
    }

    return null;
  })();

  useEffect(() => {
    if (isValidDob && !isWithinWindow && ageRelaxationValue) {
      setValue("ageRelaxation", false);
    }
  }, [isValidDob, isWithinWindow, ageRelaxationValue, setValue]);

  useEffect(() => {
    if (!isValidDob || !academicYearIdValue) {
      setAgeError(null);
      return;
    }

    const selectedYear = academicYears.find((y) => y.id === academicYearIdValue);
    if (!selectedYear) {
      setAgeError(null);
      return;
    }

    const dobPartsInternal = dobValue.split("-");
    const dob = new Date(parseInt(dobPartsInternal[0], 10), parseInt(dobPartsInternal[1], 10) - 1, parseInt(dobPartsInternal[2], 10));
    const startYear = selectedYear.startYear;
    const targetMonthIndex = ageRelaxationValue ? 5 : 2;
    const targetDay = ageRelaxationValue ? 30 : 31;
    const targetMonthName = ageRelaxationValue ? "June 30" : "March 31";
    const targetDate = new Date(startYear, targetMonthIndex, targetDay);
    let age = targetDate.getFullYear() - dob.getFullYear();
    const m = targetDate.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && targetDate.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 3) {
      setAgeError(`Student age of ${age} years is not eligible for admission. Age must be at least 3 years as of ${targetMonthName}, ${startYear}.`);
      setValue("gradeId", "");
    } else {
      setAgeError(null);

      const currentGradeId = getValues("gradeId");
      const currentGrade = grades.find((g) => g.id === currentGradeId);
      let isCurrentEligible = false;
      if (currentGrade) {
        if (age === 3 && currentGrade.name === "KG 1 (PRE-KG)") isCurrentEligible = true;
        else if (age === 4 && currentGrade.name === "KG 2 (JKG)") isCurrentEligible = true;
        else if (age >= 5) {
          if (currentGrade.name !== "KG 1 (PRE-KG)" && currentGrade.name !== "KG 2 (JKG)") {
            isCurrentEligible = true;
          }
        }
      }

      if (!isCurrentEligible) {
        let matchingGradeName = "";
        if (age === 3) matchingGradeName = "KG 1 (PRE-KG)";
        else if (age === 4) matchingGradeName = "KG 2 (JKG)";
        
        if (matchingGradeName) {
          const matchingGrade = grades.find((g) => g.name === matchingGradeName);
          if (matchingGrade) {
            setValue("gradeId", matchingGrade.id);
          }
        } else {
          setValue("gradeId", "");
        }
      }
    }
  }, [isValidDob, dobValue, academicYearIdValue, ageRelaxationValue, academicYears, grades, setValue, getValues, isWithinWindow]);

  const filteredGrades = (() => {
    if (!isValidDob || !academicYearIdValue || ageError) {
      if (ageError) return [];
      return grades;
    }

    const selectedYear = academicYears.find((y) => y.id === academicYearIdValue);
    if (!selectedYear) return grades;

    const dobPartsInternal = dobValue.split("-");
    const dob = new Date(parseInt(dobPartsInternal[0], 10), parseInt(dobPartsInternal[1], 10) - 1, parseInt(dobPartsInternal[2], 10));
    if (isNaN(dob.getTime())) return grades;

    const startYear = selectedYear.startYear;
    const targetMonthIndex = ageRelaxationValue ? 5 : 2;
    const targetDay = ageRelaxationValue ? 30 : 31;
    const targetDate = new Date(startYear, targetMonthIndex, targetDay);
    let age = targetDate.getFullYear() - dob.getFullYear();
    const m = targetDate.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && targetDate.getDate() < dob.getDate())) {
      age--;
    }

    let eligibleGradeNames: string[] = [];
    if (age === 3) eligibleGradeNames = ["KG 1 (PRE-KG)"];
    else if (age === 4) eligibleGradeNames = ["KG 2 (JKG)"];
    else if (age >= 5) {
      eligibleGradeNames = grades
        .map((g) => g.name)
        .filter((n) => n !== "KG 1 (PRE-KG)" && n !== "KG 2 (JKG)");
    }

    if (eligibleGradeNames.length === 0) return [];
    return grades.filter((g) => eligibleGradeNames.includes(g.name));
  })();

  const calculatedAge = dobValue ? calculateAgeToday(dobValue) : "";


  async function onSubmit(data: RegistrationInput) {
    if (ageError) {
      toast.error(ageError);
      return;
    }
    setLoading(true);
    try {
      if (registrationId) {
        const res = await updateRegistration(registrationId, data);
        if (!res.success) throw new Error(res.error);
        toast.success("Registration updated");
        router.push(`/registrations/${registrationId}`);
      } else {
        const res = await createRegistration(data);
        if (!res.success || !res.data) throw new Error(res.error || "Failed to create registration");
        toast.success(`Registration created: ${res.data.registrationNo}`);
        router.push(`/registrations/${res.data.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save registration");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Student Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Student Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-3">
            <Label>Given Name *</Label>
            <Input {...register("givenName")} />
            {errors.givenName && <p className="text-xs text-red-500">{errors.givenName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Date of Birth *</Label>
            <Input type="date" {...register("dateOfBirth")} />
            {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth.message}</p>}
            {ageError && <p className="text-xs text-red-500 font-medium">{ageError}</p>}
            {eligibilityFeedback && (
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                {eligibilityFeedback}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Age (Today)</Label>
            <Input value={calculatedAge || "Enter date of birth"} readOnly className="bg-muted text-muted-foreground" />
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

          <div className="space-y-2 flex flex-col justify-end pb-1.5">
            <label className={`flex items-center gap-2 ${isValidDob && !isWithinWindow ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
              <Checkbox
                checked={ageRelaxationValue}
                onCheckedChange={(v) => setValue("ageRelaxation", Boolean(v))}
                disabled={Boolean(isValidDob && !isWithinWindow)}
              />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Apply Age Relaxation</span>
            </label>
            {isValidDob && !isWithinWindow && (
              <p className="text-xs text-red-500 font-medium mt-1">
                Age relaxation cannot be applied because this is beyond June 30 threshold.
              </p>
            )}
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
            {errors.referredStudentType && <p className="text-xs text-red-500">{errors.referredStudentType.message}</p>}
          </div>

          {(referredStudentTypeValue === "SIBLING" || referredStudentTypeValue === "RELATIVE") && (
            <>
              <div className="space-y-2">
                <Label>Referred Student Name *</Label>
                <Input {...register("referredStudentName")} placeholder="Enter name" />
                {errors.referredStudentName && <p className="text-xs text-red-500">{errors.referredStudentName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Referred Student Grade / Class *</Label>
                <Input {...register("referredStudentGrade")} placeholder="e.g. KG 2 (JKG) / Grade 2" />
                {errors.referredStudentGrade && <p className="text-xs text-red-500">{errors.referredStudentGrade.message}</p>}
              </div>
            </>
          )}

          {ageRelaxationValue && (
            <div className="sm:col-span-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 p-2.5 rounded border border-amber-200/50">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Age relaxation is active. The age eligibility threshold is shifted to June 30th of the academic year.</span>
            </div>
          )}
        </CardContent>
      </Card>

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
                {filteredGrades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.gradeId && <p className="text-xs text-red-500">{errors.gradeId.message}</p>}
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
            <Input 
              {...register("address1")} 
              onBlur={(e) => {
                register("address1").onBlur(e);
                handleTransliterateAddress("address1", e.target.value);
              }}
            />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label>Address Line 1 (Tamil)</Label>
            <Input {...register("address1Ta")} />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label>Address Line 2</Label>
            <Input 
              {...register("address2")} 
              onBlur={(e) => {
                register("address2").onBlur(e);
                handleTransliterateAddress("address2", e.target.value);
              }}
            />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label>Address Line 2 (Tamil)</Label>
            <Input {...register("address2Ta")} />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input 
              {...register("city")} 
              onBlur={(e) => {
                register("city").onBlur(e);
                handleTransliterateAddress("city", e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>City (Tamil)</Label>
            <Input {...register("cityTa")} />
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
            <Select value={watch("enquirySourceId") ?? "__all__"} onValueChange={(v) => setValue("enquirySourceId", v === "__all__" ? undefined : v)}>
              <SelectTrigger><SelectValue placeholder="How did they hear about us?" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Not specified</SelectItem>
                {enquirySources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Parent Remarks / Feedback</Label>
            <Textarea {...register("parentRemarks")} placeholder="Enter parents' feedback/remarks here..." rows={3} />
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
            <Select value={watch("staffRemarks") || "NONE"} onValueChange={(v) => setValue("staffRemarks", v)}>
              <SelectTrigger><SelectValue placeholder="Select remark status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Select Remarks / Under Review</SelectItem>
                <SelectItem value="ELIGIBLE">Eligible</SelectItem>
                <SelectItem value="NOT_ELIGIBLE">Not Eligible</SelectItem>
                <SelectItem value="WAITING">Waiting</SelectItem>
              </SelectContent>
            </Select>
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

