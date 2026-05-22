"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { saveTransportRequest } from "@/features/admissions/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Pencil, Bus, MapPin, Clock, Info, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  admission: any;
  busRoutes: any[];
}

export function TransportTab({ admission, busRoutes }: Props) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const req = admission.transportReq;

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      required: req?.required ?? false,
      routeId: req?.routeId ?? "",
      stopId: req?.stopId ?? "",
      remarks: req?.remarks ?? "",
    },
  });

  const required = watch("required");
  const routeId = watch("routeId");
  const stopId = watch("stopId");

  // Find selected route and its stops
  const selectedRoute = busRoutes.find((r: any) => r.id === routeId);
  const stops = selectedRoute?.busStops ?? [];

  // Find selected stop details
  const selectedStop = stops.find((s: any) => s.id === stopId);

  async function onSubmit(data: any) {
    if (data.required) {
      if (!data.routeId) {
        toast.error("Please select a bus route");
        return;
      }
      if (!data.stopId) {
        toast.error("Please select a bus stop");
        return;
      }
    }

    setLoading(true);
    try {
      await saveTransportRequest(admission.id, {
        required: data.required,
        routeId: data.required ? data.routeId : null,
        stopId: data.required ? data.stopId : null,
        remarks: data.remarks || null,
      });
      toast.success("Transport details updated successfully");
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save transport details");
    } finally {
      setLoading(false);
    }
  }

  const handleRouteChange = (val: string) => {
    setValue("routeId", val);
    setValue("stopId", ""); // Reset stop selection when route changes
  };

  return (
    <Card className="shadow-md border-muted">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bus className="h-5 w-5 text-primary" />
            Transport Details
          </CardTitle>
          <CardDescription>
            Manage school bus transport facility for the student
          </CardDescription>
        </div>
        {admission.status === "DRAFT" && (
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
            <Pencil className="mr-1 h-4 w-4" />
            {editing ? "Cancel" : "Edit"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!editing ? (
          <div className="space-y-6">
            {!req?.required ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/40 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <Bus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-sm">No Transport Requested</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  This student has not opted for school bus transport.
                </p>
                {admission.status === "DRAFT" && (
                  <Button size="sm" variant="outline" className="mt-4" onClick={() => setEditing(true)}>
                    <Pencil className="mr-1 h-4 w-4" /> Configure Transport
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg font-medium w-fit">
                  <CheckCircle2 className="h-4 w-4" />
                  School Transport Requested
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-4 rounded-lg border">
                  <dl className="grid grid-cols-1 gap-y-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-0.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Selected Route
                      </dt>
                      <dd className="font-semibold text-foreground">
                        {req.route ? `${req.route.routeNo} - ${req.route.name}` : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-0.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Selected Stop
                      </dt>
                      <dd className="font-semibold text-foreground">
                        {req.stop ? req.stop.stopName : "-"}
                        {req.stop?.stage ? ` (Stage ${req.stop.stage})` : ""}
                      </dd>
                    </div>
                  </dl>

                  <dl className="grid grid-cols-1 gap-y-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        Estimated Timings
                      </dt>
                      <dd className="font-semibold text-foreground flex gap-4">
                        <span>Pickup: {req.stop?.pickupTime || "-"}</span>
                        <span>Drop: {req.stop?.dropTime || "-"}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground font-medium mb-0.5">Remarks</dt>
                      <dd className="font-medium text-foreground italic">
                        {req.remarks || "No remarks"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-3 rounded-lg text-xs leading-relaxed">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Fee Detail:</span> Transport Fee (Annual) of ₹8,000 has been automatically added as a pending charge under the Fees & Payments tab.
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <Checkbox
                  checked={required}
                  onCheckedChange={(v) => setValue("required", Boolean(v))}
                />
                <div className="grid gap-0.5 leading-none">
                  <span className="text-sm font-semibold">Request Bus Transport</span>
                  <span className="text-xs text-muted-foreground">Check this if the student requires school transport facility</span>
                </div>
              </label>

              {required && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/10 space-y-1 md:space-y-0">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Select Route</Label>
                    <Select value={routeId} onValueChange={handleRouteChange}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Choose a route..." />
                      </SelectTrigger>
                      <SelectContent>
                        {busRoutes.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.routeNo} - {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Select Stop</Label>
                    <Select
                      value={stopId}
                      onValueChange={(val) => setValue("stopId", val)}
                      disabled={!routeId}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder={routeId ? "Choose a stop..." : "Select route first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {stops.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.stopName} {s.stage ? `(Stage ${s.stage})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedStop && (
                    <div className="col-span-1 md:col-span-2 mt-2 bg-primary/5 border border-primary/10 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>Schedule:</span>
                      </div>
                      <div className="flex gap-4 font-semibold">
                        <span className="bg-background px-2 py-0.5 rounded border">Pickup: {selectedStop.pickupTime || "-"}</span>
                        <span className="bg-background px-2 py-0.5 rounded border">Drop: {selectedStop.dropTime || "-"}</span>
                      </div>
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold">Remarks / Specific Location details</Label>
                    <Textarea
                      {...register("remarks")}
                      rows={2}
                      className="bg-background"
                      placeholder="Enter landmarks, guardian pick up details or general remarks..."
                    />
                  </div>
                </div>
              )}
            </div>

            {required && (
              <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-800 dark:text-yellow-400 p-3 rounded-lg text-xs leading-relaxed">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Important:</span> Saving transport requirements will automatically add the annual transport fee (₹8,000) to the student's payment record.
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
