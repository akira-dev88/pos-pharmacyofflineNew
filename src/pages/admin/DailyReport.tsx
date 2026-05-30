import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { getDailyReport } from "../../renderer/services/reportApi";
import { IonIcon } from "@ionic/react";
import { printOutline, refreshOutline, calendarOutline } from "ionicons/icons";

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "../../../@/components/ui/card";
import { Button } from "../../../@/components/ui/button";
import { Input } from "../../../@/components/ui/input";
import { Badge } from "../../../@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../@/components/ui/popover";
import { Calendar } from "../../../@/components/ui/calendar";
import { ScrollArea } from "../../../@/components/ui/scroll-area";

// ── Reusable StatCard (matches other pages)
const StatCard = ({ label, value, prefix = "", gradient = "bg-gradient-to-br from-blue-500 to-blue-700" }: any) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} group cursor-default text-white min-w-0`}>
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

export default function DailyReport() {
  const { t } = useTranslation();

  const getTodayIST = () => {
    const now = new Date();
    // IST offset UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return format(istDate, "yyyy-MM-dd");
  };

  const [date, setDate] = useState<Date>(() => {
    const todayStr = getTodayIST();
    return new Date(todayStr);
  });
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await getDailyReport(format(date, "yyyy-MM-dd"));
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [date]);

  const handlePrint = () => window.print();

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n || 0);

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case "cash":
        return t("dailyReport.paymentMethods.cash");
      case "upi":
        return t("dailyReport.paymentMethods.upi");
      case "card":
        return t("dailyReport.paymentMethods.card");
      case "pay_later":
        return t("dailyReport.paymentMethods.payLater");
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const totalCollected = report?.payments?.reduce((s: number, p: any) => s + p.total, 0) || 0;

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t("dailyReport.title")}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t("dailyReport.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date picker with shadcn calendar */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 bg-white border-slate-200">
                <IonIcon icon={calendarOutline} className="text-slate-500" />
                {format(date, "dd MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
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
          <Button variant="outline" onClick={loadReport} className="bg-white border-slate-200">
            <IonIcon icon={refreshOutline} className="text-slate-600 text-xl" />
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <IonIcon icon={printOutline} className="text-xl" />
            {t("dailyReport.printButton")}
          </Button>
        </div>
      </div>

      {!report ? (
        <div className="text-center text-slate-500 py-20">{t("dailyReport.noData")}</div>
      ) : (
        <div ref={printRef} className="space-y-5">
          {/* Print header (visible only when printing) */}
          <div className="hidden print:block text-center mb-6">
            <h2 className="text-xl font-bold">{report.shop?.name || t("dailyReport.myStore")}</h2>
            {report.shop?.address && <p className="text-sm">{report.shop.address}</p>}
            {report.shop?.gstin && <p className="text-sm">{t("dailyReport.gstinLabel")}: {report.shop.gstin}</p>}
            <h3 className="text-lg font-bold mt-3">{t("dailyReport.printTitle")} — {format(date, "dd MMM yyyy")}</h3>
          </div>

          {/* Summary Cards – using StatCard with different gradients */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label={t("dailyReport.totalBills")}
              value={report.summary.total_bills}
              gradient="bg-gradient-to-br from-blue-500 to-blue-700"
            />
            <StatCard
              label={t("dailyReport.subtotal")}
              value={fmt(report.summary.subtotal)}
              prefix="₹"
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
            />
            <StatCard
              label={t("dailyReport.gstCollected")}
              value={fmt(report.summary.total_tax)}
              prefix="₹"
              gradient="bg-gradient-to-br from-amber-500 to-amber-700"
            />
            <StatCard
              label={t("dailyReport.grandTotal")}
              value={fmt(report.summary.grand_total)}
              prefix="₹"
              gradient="bg-gradient-to-br from-violet-500 to-violet-700"
            />
          </div>

          {/* Two‑column section: Payment Breakdown & GST Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Payment Breakdown Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800">
                  {t("dailyReport.paymentBreakdown")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.payments.length === 0 ? (
                  <p className="text-slate-400 text-sm">{t("dailyReport.noPayments")}</p>
                ) : (
                  <div className="space-y-2">
                    {report.payments.map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                        <span className="text-slate-600">{getPaymentLabel(p.method)}</span>
                        <span className="font-semibold text-slate-800">₹{fmt(p.total)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 font-bold text-slate-900 border-t border-slate-200">
                      <span>{t("dailyReport.totalCollected")}</span>
                      <span className="text-emerald-600">₹{fmt(totalCollected)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GST Summary Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800">
                  {t("dailyReport.gstSummary")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.gst_slabs.length === 0 ? (
                  <p className="text-slate-400 text-sm">{t("dailyReport.noGst")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-100">
                          <th className="text-left py-1">{t("dailyReport.slabHeader")}</th>
                          <th className="text-right py-1">{t("dailyReport.taxableAmtHeader")}</th>
                          <th className="text-right py-1">{t("dailyReport.cgstHeader")}</th>
                          <th className="text-right py-1">{t("dailyReport.sgstHeader")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.gst_slabs.map((g: any, i: number) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 text-slate-600">{g.tax_percent}%</td>
                            <td className="py-2 text-right text-slate-700">₹{fmt(g.taxable_amount)}</td>
                            <td className="py-2 text-right text-slate-700">₹{fmt(g.tax_collected / 2)}</td>
                            <td className="py-2 text-right text-slate-700">₹{fmt(g.tax_collected / 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Products Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">
                {t("dailyReport.topProducts")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.top_products.length === 0 ? (
                <p className="text-slate-400 text-sm">{t("dailyReport.noSales")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-100">
                        <th className="text-left py-2">#</th>
                        <th className="text-left py-2">{t("dailyReport.productHeader")}</th>
                        <th className="text-right py-2">{t("dailyReport.qtySoldHeader")}</th>
                        <th className="text-right py-2">{t("dailyReport.revenueHeader")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.top_products.map((p: any, i: number) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="py-2 text-slate-400">{i + 1}</td>
                          <td className="py-2 font-medium text-slate-800">{p.name}</td>
                          <td className="py-2 text-right text-slate-600">{p.qty_sold}</td>
                          <td className="py-2 text-right font-semibold text-emerald-600">₹{fmt(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Bills Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">
                {t("dailyReport.billsHeader", { count: report.bills.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.bills.length === 0 ? (
                <p className="text-slate-400 text-sm">{t("dailyReport.noBills")}</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="text-slate-500 border-b border-slate-100">
                          <th className="text-left py-2">{t("dailyReport.invoiceHeader")}</th>
                          <th className="text-left py-2">{t("dailyReport.customerHeader")}</th>
                          <th className="text-left py-2">{t("dailyReport.timeHeader")}</th>
                          <th className="text-right py-2">{t("dailyReport.amountHeader")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.bills.map((b: any, i: number) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                            <td className="py-2 font-mono text-slate-700">{b.invoice_number}</td>
                            <td className="py-2 text-slate-600">{b.customer_name || t("dailyReport.walkInCustomer")}</td>
                            <td className="py-2 text-slate-500">
                              {new Date(b.created_at).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </td>
                            <td className="py-2 text-right font-semibold text-slate-800">₹{fmt(b.grand_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Print styles (keep original logic) */}
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body * { visibility: hidden; }
          #root * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          [ref="printRef"], [ref="printRef"] * { visibility: visible; }
          [ref="printRef"] {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}