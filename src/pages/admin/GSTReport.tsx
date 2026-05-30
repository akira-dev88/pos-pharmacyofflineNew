import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { getGSTReport } from "../../renderer/services/reportApi";
import { IonIcon } from "@ionic/react";
import { calendarOutline, downloadOutline, printOutline, refreshOutline } from "ionicons/icons";
import * as XLSX from "xlsx";

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// ── Reusable StatCard (matches other pages)
const StatCard = ({ label, value, prefix = "", gradient = "bg-gradient-to-br from-blue-500 to-blue-700" }: any) => (
    <div className={`relative overflow-hidden rounded-2xl p-5  text-start ${gradient} group cursor-default text-white min-w-0`}>
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1 truncate">{label}</p>
                <p className="text-2xl sm:text-3xl font-bold mt-0.5 truncate">
                    {prefix}{value}
                </p>
            </div>
        </div>
        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors" />
    </div>
);

export default function GSTReport() {
    const { t } = useTranslation();
    const currentMonth = new Date();
    const [month, setMonth] = useState<Date>(currentMonth);
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        load();
    }, [month]);

    const load = async () => {
        setLoading(true);
        try {
            const data = await getGSTReport(format(month, "yyyy-MM"));
            setReport(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fmt = (n: number) =>
        new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n || 0);

    const monthLabel = format(month, "MMMM yyyy");

    // Excel Export
    const handleExcelDownload = () => {
        if (!report) return;
        const wb = XLSX.utils.book_new();

        // Sheet 1: GST Summary by slab
        const slabRows = [
            [t("gstReport.excelTitle", { month: monthLabel })],
            [t("gstReport.shopLabel") + ": " + (report.shop?.name || "N/A")],
            [t("gstReport.gstinLabel") + ": " + (report.shop?.gstin || "N/A")],
            [],
            [t("gstReport.slabSummaryHeader")],
            [
                t("gstReport.taxRateHeader"),
                t("gstReport.invoicesHeader"),
                t("gstReport.taxableValueHeader"),
                t("gstReport.cgstHeader"),
                t("gstReport.sgstHeader"),
                t("gstReport.totalTaxHeader"),
            ],
            ...report.slabs.map((s: any) => [
                s.tax_percent + "%",
                s.invoice_count,
                s.taxable_value?.toFixed(2),
                (s.total_tax / 2)?.toFixed(2),
                (s.total_tax / 2)?.toFixed(2),
                s.total_tax?.toFixed(2),
            ]),
            [],
            [t("gstReport.exemptZeroRated"), "", report.exempt_value?.toFixed(2), 0, 0, 0],
            [],
            [
                `${t("gstReport.totalLabel")} (${report.summary.total_invoices} ${t("gstReport.billsUnit")})`,
                "",
                report.summary.total_taxable?.toFixed(2),
                (report.summary.total_tax / 2)?.toFixed(2),
                (report.summary.total_tax / 2)?.toFixed(2),
                report.summary.total_tax?.toFixed(2),
            ],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(slabRows);
        ws1["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws1, "GST Summary");

        // Sheet 2: Invoice list
        const invoiceRows = [
            [t("gstReport.invoiceListTitle", { month: monthLabel })],
            [],
            [
                t("gstReport.invoiceNoHeader"),
                t("gstReport.dateHeader"),
                t("gstReport.customerHeader"),
                t("gstReport.taxableValueHeader"),
                t("gstReport.taxHeader"),
                t("gstReport.grandTotalHeader"),
            ],
            ...report.invoices.map((inv: any) => [
                inv.invoice_number,
                new Date(inv.created_at).toLocaleDateString("en-IN"),
                inv.customer_name || t("gstReport.walkInCustomer"),
                inv.total?.toFixed(2),
                inv.tax?.toFixed(2),
                inv.grand_total?.toFixed(2),
            ]),
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(invoiceRows);
        ws2["!cols"] = [{ wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws2, "Invoices");

        XLSX.writeFile(wb, `GST_Report_${format(month, "yyyy-MM")}.xlsx`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-start">{t("gstReport.title")}</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{t("gstReport.subtitle")}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Month picker with shadcn calendar */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="gap-2 bg-white border-slate-200">
                                <IonIcon icon={calendarOutline} className="text-slate-500" />
                                {monthLabel}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none">
                            <Calendar
                                mode="single"
                                selected={month}
                                onSelect={(newDate) => newDate && setMonth(newDate)}
                                className="rounded-xl bg-[#141414] p-4 text-white shadow-2xl"
                                classNames={{
                                    months: "space-y-4",
                                    month: "space-y-4",
                                    month_caption: "flex items-center justify-center gap-4 pt-1",
                                    nav: "absolute inset-x-0 top-1 flex items-center justify-between px-1",
                                    button_previous: "h-8 w-8 rounded-md text-zinc-400 hover:bg-white/10 hover:text-white transition flex items-center justify-center",
                                    button_next: "h-8 w-8 rounded-md text-zinc-400 hover:bg-white/10 hover:text-white transition flex items-center justify-center",
                                    caption_label: "text-sm font-semibold text-white",
                                    month_grid: "w-full border-collapse",
                                    weekdays: "flex",
                                    weekday: "text-zinc-500 rounded-md w-9 font-normal text-[0.8rem]",
                                    week: "flex w-full mt-2",
                                    day: "h-9 w-9 p-0 font-normal text-zinc-200 rounded-md transition-colors hover:bg-white/10 hover:text-white aria-selected:opacity-100",
                                    selected: "bg-green-500 text-black font-semibold",
                                    today: "border border-white/20 bg-white/10 text-white",
                                    outside: "text-zinc-700 opacity-50",
                                    disabled: "text-zinc-700 opacity-30",
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" onClick={load} className="bg-white border-slate-200">
                        <IonIcon icon={refreshOutline} className="text-slate-600 text-xl" />
                    </Button>
                    <Button
                        onClick={handleExcelDownload}
                        disabled={!report}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                        <IonIcon icon={downloadOutline} className="text-xl" />
                        {t("gstReport.downloadExcel")}
                    </Button>
                    <Button
                        onClick={() => window.print()}
                        disabled={!report}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        <IonIcon icon={printOutline} className="text-xl" />
                        {t("gstReport.printButton")}
                    </Button>
                </div>
            </div>

            {!report ? (
                <Card>
                    <CardContent className="text-center py-20 text-slate-500">
                        {t("gstReport.noData")}
                    </CardContent>
                </Card>
            ) : !report?.summary ? (
                <Card>
                    <CardContent className="text-center py-20 text-slate-500">
                        {t("gstReport.noDataForMonth")}
                    </CardContent>
                </Card>
            ) : (
                <div id="gst-print-area" className="space-y-5">
                    {/* Print header (visible only when printing) */}
                    <div className="hidden print:block text-center mb-6">
                        <h2 className="text-xl font-bold">{report.shop?.name}</h2>
                        {report.shop?.gstin && <p className="text-sm">{t("gstReport.gstinLabel")}: {report.shop.gstin}</p>}
                        <h3 className="text-lg font-bold mt-3">{t("gstReport.printTitle")} — {monthLabel}</h3>
                    </div>

                    {/* Summary Cards – using StatCard */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label={t("gstReport.totalInvoices")}
                            value={report.summary.total_invoices}
                            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
                        />
                        <StatCard
                            label={t("gstReport.taxableValue")}
                            value={fmt(report.summary.total_taxable)}
                            prefix="₹"
                            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
                        />
                        <StatCard
                            label={t("gstReport.totalGst")}
                            value={fmt(report.summary.total_tax)}
                            prefix="₹"
                            gradient="bg-gradient-to-br from-amber-500 to-amber-700"
                        />
                        <StatCard
                            label={t("gstReport.grandTotal")}
                            value={fmt(report.summary.grand_total)}
                            prefix="₹"
                            gradient="bg-gradient-to-br from-violet-500 to-violet-700"
                        />
                    </div>

                    {/* GST Slab Table */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-t-2xl">
                            <CardTitle className="text-white">{t("gstReport.slabSummaryTitle")}</CardTitle>
                            <p className="text-slate-300 text-sm">{t("gstReport.slabSummaryDesc")}</p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className={report.summary.total_invoices > 0 ? "max-h-[400px]" : "h-[200px]"}>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 border-b border-slate-200">
                                            <TableHead className="text-left">{t("gstReport.taxRateHeader")}</TableHead>
                                            <TableHead className="text-right">{t("gstReport.invoicesHeader")}</TableHead>
                                            <TableHead className="text-right">{t("gstReport.taxableValueHeader")}</TableHead>
                                            <TableHead className="text-right">{t("gstReport.cgstHeader")}</TableHead>
                                            <TableHead className="text-right">{t("gstReport.sgstHeader")}</TableHead>
                                            <TableHead className="text-right">{t("gstReport.totalTaxHeader")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {report.summary.total_invoices === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                                                    {t("gstReport.noGstTransactions")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            <>
                                                {report.slabs.map((s: any, i: number) => (
                                                    <TableRow key={i} className="border-b border-slate-100 hover:bg-slate-50/80">
                                                        <TableCell className="font-semibold text-slate-800">{s.tax_percent}%</TableCell>
                                                        <TableCell className="text-right text-slate-600">{s.invoice_count}</TableCell>
                                                        <TableCell className="text-right text-slate-700">₹{fmt(s.taxable_value)}</TableCell>
                                                        <TableCell className="text-right text-blue-600">₹{fmt(s.total_tax / 2)}</TableCell>
                                                        <TableCell className="text-right text-blue-600">₹{fmt(s.total_tax / 2)}</TableCell>
                                                        <TableCell className="text-right font-semibold text-slate-800">₹{fmt(s.total_tax)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {(report.exempt_value > 0 || report.slabs.length === 0) && (
                                                    <TableRow className="border-b border-slate-100 hover:bg-slate-50/80">
                                                        <TableCell className="font-semibold text-slate-800">0% ({t("gstReport.exemptLabel")})</TableCell>
                                                        <TableCell className="text-right text-slate-600">{report.summary.total_invoices}</TableCell>
                                                        <TableCell className="text-right text-slate-700">₹{fmt(report.exempt_value || report.summary.total_taxable)}</TableCell>
                                                        <TableCell className="text-right text-slate-400">₹0.00</TableCell>
                                                        <TableCell className="text-right text-slate-400">₹0.00</TableCell>
                                                        <TableCell className="text-right font-semibold text-slate-800">₹0.00</TableCell>
                                                    </TableRow>
                                                )}
                                                <TableRow className="bg-slate-800 text-white hover:bg-slate-800">
                                                    <TableCell className="font-bold">{t("gstReport.totalLabel")}</TableCell>
                                                    <TableCell className="text-right font-bold">{report.summary.total_invoices} {t("gstReport.billsUnit")}</TableCell>
                                                    <TableCell className="text-right font-bold">₹{fmt(report.summary.total_taxable)}</TableCell>
                                                    <TableCell className="text-right font-bold">₹{fmt(report.summary.total_tax / 2)}</TableCell>
                                                    <TableCell className="text-right font-bold">₹{fmt(report.summary.total_tax / 2)}</TableCell>
                                                    <TableCell className="text-right font-bold">₹{fmt(report.summary.total_tax)}</TableCell>
                                                </TableRow>
                                            </>
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Invoice List */}
                    <Card>
                        <CardHeader className="flex flex-row justify-between items-center border-b border-slate-100">
                            <CardTitle className="text-lg font-semibold text-slate-800">
                                {t("gstReport.invoiceListHeader", { count: report.invoices.length })}
                            </CardTitle>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600">{monthLabel}</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[500px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 border-b border-slate-200 sticky top-0">
                                            <TableHead>{t("gstReport.invoiceNoHeader")}</TableHead>
                                            <TableHead>{t("gstReport.dateHeader")}</TableHead>
                                            <TableHead>{t("gstReport.customerHeader")}</TableHead>
                                            <TableHead>{t("gstReport.taxableHeader")}</TableHead>
                                            <TableHead>{t("gstReport.taxHeader")}</TableHead>
                                            <TableHead>{t("gstReport.grandTotalHeader")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {report.invoices.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                                                    {t("gstReport.noInvoices")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            report.invoices.map((inv: any, i: number) => (
                                                <TableRow key={i} className="border-b text-left border-slate-100 hover:bg-slate-50/80">
                                                    <TableCell className="font-mono text-slate-700">{inv.invoice_number}</TableCell>
                                                    <TableCell className="text-slate-600">
                                                        {new Date(inv.created_at).toLocaleDateString("en-IN")}
                                                    </TableCell>
                                                    <TableCell className="text-slate-600">
                                                        {inv.customer_name || t("gstReport.walkInCustomer")}
                                                    </TableCell>
                                                    <TableCell className="text-slate-700">₹{fmt(inv.total)}</TableCell>
                                                    <TableCell className="text-amber-600">₹{fmt(inv.tax)}</TableCell>
                                                    <TableCell className="font-semibold text-slate-800">₹{fmt(inv.grand_total)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Print styles */}
            <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body * { visibility: hidden; }
          #gst-print-area, #gst-print-area * { visibility: visible; }
          #gst-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
        </div>
    );
}
