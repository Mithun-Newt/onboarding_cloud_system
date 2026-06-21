"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Edit2, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { saveCohortStrengths, getRolloverStrengths } from "@/features/dashboard/cohort-actions";

interface CohortRow {
  id: string;
  className: string;
  promotedStrength: number;
  tc: number;
  newAdmission: number;
  target: number;
  sortOrder: number;
}

export function CohortTable({
  initialStrengths,
  academicYearId,
  isWriteAllowed,
  dbConfirmedCounts,
}: {
  initialStrengths: CohortRow[];
  academicYearId: string;
  isWriteAllowed: boolean;
  dbConfirmedCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<CohortRow[]>(initialStrengths);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Track initial values to check for changes
  const initialMap = new Map(initialStrengths.map(r => [r.id, r]));
  const hasChanges = rows.some(row => {
    const init = initialMap.get(row.id);
    if (!init) return true;
    return (
      row.promotedStrength !== init.promotedStrength ||
      row.tc !== init.tc ||
      row.target !== init.target
    );
  });

  const handleInputChange = (id: string, field: keyof CohortRow, value: string) => {
    setRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        const parsed = parseInt(value, 10);
        return { ...row, [field]: isNaN(parsed) ? 0 : parsed };
      })
    );
  };

  const handleSave = () => {
    if (!academicYearId) {
      toast.error("Academic year is not selected");
      return;
    }

    startTransition(async () => {
      try {
        const res = await saveCohortStrengths(academicYearId, rows);
        if (!res.success) throw new Error(res.error);
        toast.success("Cohort strengths updated successfully");
        setIsEditing(false);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to save changes");
      }
    });
  };

  
  const handleRollover = () => {
    if (!academicYearId) return;
    if (!confirm("This will load the final Achieved strengths from the previous academic year. Any unsaved changes will be lost. Proceed?")) return;

    startTransition(async () => {
      try {
        const res = await getRolloverStrengths(academicYearId);
        if (res.success) {
          setRows(res.data);
          setIsEditing(true);
          toast.success("Rollover calculated! Review the numbers and click Save Changes.");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load rollover data");
      }
    });
  };

  const handleCancel = () => {
    setRows(initialStrengths);
    setIsEditing(false);
  };

  // Sync rows if initialStrengths changes externally
  const initialIds = initialStrengths.map(r => r.id).join(",");
  const currentIds = rows.map(r => r.id).join(",");
  if (initialIds !== currentIds && initialStrengths.length > 0) {
    setRows(initialStrengths);
  }

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-bold">Cohort Strength Flow</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manually edit cohort flow inputs. Derived values (Retained, Achieved, Vacancy) are computed automatically.
          </p>
        </div>
        {isWriteAllowed && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleRollover} variant="outline" size="sm" disabled={isPending} className="border-gray-200 text-blue-600">
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Load from Previous Year
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm" disabled={isPending} className="border-gray-200">
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isPending || !hasChanges} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                {rows.length === 0 && (
                  <Button onClick={handleRollover} size="sm" variant="outline" disabled={isPending} className="border-gray-200 text-blue-600">
                    <RefreshCw className="mr-1 h-4 w-4" />
                    Load from Previous Year
                  </Button>
                )}
                <Button onClick={() => setIsEditing(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Edit2 className="mr-1 h-4 w-4" />
                  Edit Cohort
                </Button>
              </>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="font-semibold text-gray-900 w-[220px]">Promoted Class</TableHead>
                <TableHead className="font-semibold text-gray-900 text-center w-[125px]">Promoted Strength</TableHead>
                <TableHead className="font-semibold text-gray-900 text-center w-[100px]">TC</TableHead>
                <TableHead className="font-semibold text-gray-900 text-center w-[140px] bg-gray-50/20">Retained Strength</TableHead>
                <TableHead className="font-semibold text-gray-900 text-center w-[130px]">New Admission</TableHead>
                <TableHead className="font-semibold text-gray-900 text-center w-[110px] bg-gray-50/20">Achieved</TableHead>
                <TableHead className="font-semibold text-gray-900 text-center w-[110px]">Target</TableHead>
                <TableHead className="font-semibold text-gray-900 text-center w-[110px] bg-gray-50/20">Vacancy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => {
                const dbConfirmed = dbConfirmedCounts[row.className] ?? 0;
                const displayNewAdmission = row.newAdmission + dbConfirmed;
                const retained = row.promotedStrength - row.tc;
                const achieved = retained + displayNewAdmission;
                const vacancy = row.target - achieved;

                return (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    {/* Promoted Class */}
                    <TableCell className="font-semibold text-gray-800">
                      {row.className}
                    </TableCell>

                    {/* Promoted Strength */}
                    <TableCell className="text-center">
                      {isEditing && isWriteAllowed ? (
                        <Input
                          type="number"
                          min="0"
                          value={row.promotedStrength}
                          onChange={e => handleInputChange(row.id, "promotedStrength", e.target.value)}
                          className="h-8 py-1 px-2 text-center border-gray-200"
                        />
                      ) : (
                        <span className="font-medium text-gray-700">{row.promotedStrength}</span>
                      )}
                    </TableCell>

                    {/* TC */}
                    <TableCell className="text-center">
                      {isEditing && isWriteAllowed ? (
                        <Input
                          type="number"
                          min="0"
                          value={row.tc}
                          onChange={e => handleInputChange(row.id, "tc", e.target.value)}
                          className="h-8 py-1 px-2 text-center border-gray-200"
                        />
                      ) : (
                        <span className="font-medium text-gray-700">{row.tc}</span>
                      )}
                    </TableCell>

                    {/* Retained Strength (Calculated) */}
                    <TableCell className="text-center font-semibold bg-gray-50/10 text-gray-700">
                      {retained}
                    </TableCell>

                    {/* New Admission (Read-only, automatically includes live confirmations) */}
                    <TableCell className="text-center font-medium text-gray-700">
                      {displayNewAdmission}
                    </TableCell>

                    {/* Achieved (Calculated) */}
                    <TableCell className="text-center font-semibold bg-gray-50/10 text-gray-700">
                      {achieved}
                    </TableCell>

                    {/* Target */}
                    <TableCell className="text-center">
                      {isEditing && isWriteAllowed ? (
                        <Input
                          type="number"
                          min="0"
                          value={row.target}
                          onChange={e => handleInputChange(row.id, "target", e.target.value)}
                          className="h-8 py-1 px-2 text-center border-gray-200"
                        />
                      ) : (
                        <span className="font-medium text-gray-700">{row.target}</span>
                      )}
                    </TableCell>

                    {/* Vacancy (Calculated) */}
                    <TableCell
                      className={`text-center font-bold bg-gray-50/10 ${
                        vacancy < 0 ? "text-red-600 bg-red-50/20" : vacancy === 0 ? "text-amber-600" : "text-green-600"
                      }`}
                    >
                      {vacancy}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
