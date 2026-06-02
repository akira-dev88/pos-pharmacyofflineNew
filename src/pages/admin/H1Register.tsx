import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { getH1Register, getH1RegisterByDateRange } from "../../renderer/services/h1RegisterApi";
import { IonIcon } from "@ionic/react";
import { refreshOutline, calendarOutline, searchOutline } from "ionicons/icons";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function H1Register() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  const loadRecords = async () => {
    setLoading(true);
    try {
      let data: any[];
      if (fromDate && toDate) {
        data = await getH1RegisterByDateRange(
          format(fromDate, "yyyy-MM-dd"),
          format(toDate, "yyyy-MM-dd")
        );
      } else {
        data = await getH1Register();
      }
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load H1 register:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      loadRecords();
    }
  }, [fromDate, toDate]);

  const filtered = records.filter((r) =>
    [r.patient_name, r.doctor_name, r.prescription_number, r.product_name]
      .some((f) => f?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const clearFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    loadRecords();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">H1 Register</h1>
          <p className="text-slate-500 text-sm mt-0.5">Schedule H1 narcotics register</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 bg-white border-slate-200">
                  <IonIcon icon={calendarOutline} className="text-slate-500" />
                  {fromDate ? format(fromDate, "dd MMM yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={(d) => d && setFromDate(d)}
                  className="rounded-xl bg-[#141414] p-4 text-white shadow-2xl"
                  classNames={{
                    months: "space-y-4",
                    month: "space-y-4",
                    month_caption: "flex items-center justify-center gap-4 pt-1",
                    nav: "absolute inset-x-0 top-1 flex items-center justify-between px-1",
                    button_previous: "h-8 w-8 rounded-md text-zinc-400 hover:bg-white/10 hover:text-white transition",
                    button_next: "h-8 w-8 rounded-md text-zinc-400 hover:bg-white/10 hover:text-white transition",
                    caption_label: "text-sm font-semibold text-white",
                    month_grid: "w-full border-collapse",
                    weekdays: "flex",
                    weekday: "text-zinc-500 rounded-md w-9 font-normal text-[0.8rem]",
                    week: "flex w-full mt-2",
                    day: "h-9 w-9 p-0 font-normal text-zinc-200 rounded-md transition-colors hover:bg-white/10 hover:text-white",
                    selected: "bg-green-500 text-black font-semibold",
                    today: "border border-white/20 bg-white/10 text-white",
                    outside: "text-zinc-700 opacity-50",
                    disabled: "text-zinc-700 opacity-30",
                  }}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 bg-white border-slate-200">
                  <IonIcon icon={calendarOutline} className="text-slate-500" />
                  {toDate ? format(toDate, "dd MMM yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={(d) => d && setToDate(d)}
                  className="rounded-xl bg-[#141414] p-4 text-white shadow-2xl"
                  classNames={{
                    months: "space-y-4",
                    month: "space-y-4",
                    month_caption: "flex items-center justify-center gap-4 pt-1",
                    nav: "absolute inset-x-0 top-1 flex items-center justify-between px-1",
                    button_previous: "h-8 w-8 rounded-md text-zinc-400 hover:bg-white/10 hover:text-white transition",
                    button_next: "h-8 w-8 rounded-md text-zinc-400 hover:bg-white/10 hover:text-white transition",
                    caption_label: "text-sm font-semibold text-white",
                    month_grid: "w-full border-collapse",
                    weekdays: "flex",
                    weekday: "text-zinc-500 rounded-md w-9 font-normal text-[0.8rem]",
                    week: "flex w-full mt-2",
                    day: "h-9 w-9 p-0 font-normal text-zinc-200 rounded-md transition-colors hover:bg-white/10 hover:text-white",
                    selected: "bg-green-500 text-black font-semibold",
                    today: "border border-white/20 bg-white/10 text-white",
                    outside: "text-zinc-700 opacity-50",
                    disabled: "text-zinc-700 opacity-30",
                  }}
                />
              </PopoverContent>
            </Popover>
            {(fromDate || toDate) && (
              <Button variant="ghost" onClick={clearFilters} className="text-slate-500">
                Clear
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={loadRecords} className="bg-white border-slate-200">
            <IonIcon icon={refreshOutline} className="text-slate-600 text-xl" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <IonIcon icon={searchOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by patient, doctor, prescription..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-slate-400 py-12">No H1 register entries found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Age/Gender</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Prescription #</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Pharmacist</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r: any) => (
                    <TableRow key={r.register_uuid || r.id}>
                      <TableCell className="text-slate-600 text-xs font-mono">
                        {new Date(r.created_at).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">{r.patient_name}</TableCell>
                      <TableCell>
                        {r.patient_age && <span className="text-slate-600">{r.patient_age}y</span>}
                        {r.patient_gender && (
                          <Badge variant="outline" className="ml-1 text-[10px]">
                            {r.patient_gender}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-700">{r.doctor_name}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{r.doctor_license || "-"}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">{r.prescription_number}</TableCell>
                      <TableCell className="text-right font-semibold">{r.quantity}</TableCell>
                      <TableCell className="text-slate-600">{r.pharmacist_name || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
