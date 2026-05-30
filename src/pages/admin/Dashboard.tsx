import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { IonIcon } from "@ionic/react";
import {
  trendingUpOutline,
  cashOutline,
  cartOutline,
  peopleOutline,
  warningOutline,
  cubeOutline,
  timeOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { getDashboardReport } from "../../renderer/services/reportApi";
import { getSalesTrend } from "../../renderer/services/reportApi";
import { getProfitTrend } from "../../renderer/services/reportApi";
import { getCustomerSummary } from "../../renderer/services/customerApi";
import ProfitLineChart from "./ProfitLineChart";

// ── salesChartConfig
const salesChartConfig = {
  total: {
    label: "Sales",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

// ── StatCard (icons already centered via flex)
const StatCard = ({ label, value, delta, gradient, icon }: any) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} group cursor-default text-white min-w-0`}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1 truncate">
          {label}
        </p>
        <p className="text-2xl sm:text-3xl font-bold mt-0.5 truncate">{value}</p>
        {delta && <p className="text-xs mt-1.5 opacity-80">{delta}</p>}
      </div>
      <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors" />
  </div>
);

// ── formatCompactNumber
const formatCompactNumber = (num: number): string => {
  if (num === null || num === undefined) return "0";
  const absNum = Math.abs(num);
  if (absNum >= 10000000) return (num / 10000000).toFixed(2) + "cr";
  if (absNum >= 100000) return (num / 100000).toFixed(2) + "L";
  if (absNum >= 1000) return (num / 1000).toFixed(2) + "k";
  return num.toFixed(2);
};

// ── Dark card style shorthand
const darkCard = {
  style: { background: "#0f1117" },
  className: "border-0 shadow-xl rounded-2xl",
};

const darkBadge = {
  variant: "secondary" as const,
  style: {
    background: "#1e2330",
    color: "#64748b",
    border: "0.5px solid #2d3347",
  },
};

export default function Dashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profitTrend, setProfitTrend] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [customerSummary, setCustomerSummary] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const report = await getDashboardReport();
      setData(
        report || {
          today_sales: 0,
          month_sales: 0,
          total_sales: 0,
          total_orders: 0,
          low_stock: [],
          recent_sales: [],
          recent_purchases: [],
          top_products: [],
        }
      );
      const summary = await getCustomerSummary();
      setCustomerSummary(summary);

      const salesTrend = await getSalesTrend();
      if (salesTrend && Array.isArray(salesTrend)) {
        setTrend(
          salesTrend.map((d: any) => ({
            ...d,
            date: d.date ? format(new Date(d.date), "dd MMM") : "—",
          }))
        );
      }

      const profitData = await getProfitTrend();
      if (profitData && Array.isArray(profitData)) {
        setProfitTrend(
          profitData.map((d: any) => ({
            ...d,
            date: d.date ? format(new Date(d.date), "dd MMM") : "—",
          }))
        );
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      setData({
        today_sales: 0,
        month_sales: 0,
        total_sales: 0,
        total_orders: 0,
        low_stock: [],
        recent_sales: [],
        recent_purchases: [],
        top_products: [],
      });
      setCustomerSummary({
        total_credit: 0,
        customers_with_credit: 0,
        top_debtors: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [refreshTrigger, loadAllData]);

  useEffect(() => {
    const handleRefresh = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("refresh-dashboard", handleRefresh);
    return () => window.removeEventListener("refresh-dashboard", handleRefresh);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-red-500 text-center p-8">
        {t("dashboard.failedToLoad")}
      </div>
    );
  }

  const currentTotalCredit = customerSummary?.total_credit ?? 0;
  const currentCustomersWithCredit = customerSummary?.customers_with_credit ?? 0;
  const currentTopDebtors = customerSummary?.top_debtors ?? [];

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-4 sm:p-6 space-y-5 pb-10">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t("dashboard.title")}
          </h1>
        </div>
        <p className="text-xs text-slate-400">
          {format(new Date(), "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 text-start">
        {[
          {
            label: "Today's Sales",
            value: `₹${formatCompactNumber(data.today_sales || 0)}`,
            delta: "Last 24 hours",
            gradient: "bg-gradient-to-br from-emerald-500 to-emerald-700",
            icon: <IonIcon icon={cashOutline} className="w-5 h-5 text-white" />,
          },
          {
            label: "Monthly Sales",
            value: `₹${formatCompactNumber(data.month_sales || 0)}`,
            delta: "This month",
            gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
            icon: <IonIcon icon={trendingUpOutline} className="w-5 h-5 text-white" />,
          },
          {
            label: "Total Sales",
            value: `₹${formatCompactNumber(data.total_sales || 0)}`,
            delta: "Lifetime revenue",
            gradient: "bg-gradient-to-br from-violet-500 to-violet-700",
            icon: <IonIcon icon={cartOutline} className="w-5 h-5 text-white" />,
          },
          {
            label: "Total Orders",
            value: (data.total_orders || 0).toLocaleString(),
            delta: "Invoices processed",
            gradient: "bg-gradient-to-br from-amber-500 to-amber-700",
            icon: <IonIcon icon={cubeOutline} className="w-5 h-5 text-white" />,
          },
        ].map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Credit + Profit Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-5 items-start">

        {/* Left: Credit card + Top Debtors */}
        <div className="flex flex-col gap-5 min-w-0">
          <Card className="bg-gradient-to-br from-red-500 to-red-600 border-0 shadow-lg rounded-2xl">
            <CardContent className="p-5 text-white">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="text-red-100 text-sm font-medium">Credit Given</p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-xs text-red-200">₹</span>
                    <p className="text-3xl sm:text-4xl font-bold truncate">
                      {currentTotalCredit.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-red-100 text-sm mt-2">
                    {t("dashboard.customersWithDues", {
                      count: currentCustomersWithCredit,
                    })}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shrink-0 flex items-center justify-center">
                  <IonIcon icon={peopleOutline} className="text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 rounded-2xl min-w-0">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <div className="p-1 bg-red-100 rounded-lg shrink-0 flex items-center justify-center">
                  <IonIcon icon={warningOutline} className="text-red-500 text-lg" />
                </div>
                Top Debtors
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 px-3">
              <ScrollArea className="h-[150px]">
                {currentTopDebtors.length > 0 ? (
                  currentTopDebtors.map((c: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0 px-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                            i === 0
                              ? "bg-yellow-100 text-yellow-600"
                              : i === 1
                              ? "bg-slate-100 text-slate-600"
                              : i === 2
                              ? "bg-orange-100 text-orange-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <span className="text-slate-700 font-medium text-sm truncate">
                          {c.name}
                        </span>
                      </div>
                      <span className="font-semibold text-red-600 text-sm shrink-0 ml-2">
                        ₹{formatCompactNumber(c.credit_balance)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-2">
                    <IonIcon
                      icon={checkmarkCircleOutline}
                      className="text-4xl text-emerald-500"
                    />
                    <p className="text-sm">No debtors</p>
                    <p className="text-xs">All accounts cleared</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right: Profit Line Chart */}
        <div className="min-w-0">
          <Card {...darkCard} className={`${darkCard.className} h-full`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="text-lg font-semibold text-slate-100">
                  Profit Analysis
                </CardTitle>
                <Badge {...darkBadge} className="p-1">Last 7 days</Badge>
              </div>
              <div className="flex gap-4 mt-2 flex-wrap">
                {[
                  { color: "#10b981", label: "Revenue" },
                  { color: "#f87171", label: "Cost" },
                  { color: "#a78bfa", label: "Profit" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs" style={{ color: "#94a3b8" }}>{label}</span>
                  </div>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <ProfitLineChart data={profitTrend} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sales Trend + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

        {/* Sales Bar Chart */}
        <div className="min-w-0">
          <Card {...darkCard}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold text-slate-100">
                  Sales Trend
                </CardTitle>
                <Badge {...darkBadge}>Last 7 days</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={salesChartConfig} className="h-[300px] w-full">
                <BarChart
                  accessibilityLayer
                  data={trend}
                  margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2330" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    stroke="#4b5563"
                    fontSize={11}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    stroke="#4b5563"
                    fontSize={11}
                    width={48}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    cursor={{ fill: "#1e2330" }}
                    content={
                      <ChartTooltipContent
                        className="rounded-xl border-[#2d3347] bg-[#1a1f2e] text-slate-200 shadow-xl"
                        formatter={(value) => (
                          <>
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: "#3b82f6" }}
                            />
                            <span className="text-slate-400">Sales</span>
                            <span className="ml-auto font-semibold text-slate-100">
                              ₹{Number(value).toLocaleString()}
                            </span>
                          </>
                        )}
                      />
                    }
                  />
                  <Bar
                    dataKey="total"
                    fill="var(--color-total)"
                    radius={[8, 8, 0, 0]}
                    barSize={36}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock */}
        <div className="min-w-0">
          <Card className="shadow-sm border-slate-200 rounded-2xl h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <div className="p-1 bg-orange-100 rounded-lg shrink-0 flex items-center justify-center">
                    <IonIcon icon={warningOutline} className="text-orange-500 text-lg" />
                  </div>
                  Low Stock Alert
                </CardTitle>
                <Badge variant="secondary" className="bg-orange-50 text-orange-600">
                  Needs attention
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-2">
                {data.low_stock?.length === 0 ? (
                  <div className="text-center py-8 text-emerald-500 flex flex-col items-center gap-2">
                    <IonIcon icon={checkmarkCircleOutline} className="text-4xl" />
                    <p className="text-sm">All stock levels are good</p>
                  </div>
                ) : (
                  data.low_stock?.slice(0, 5).map((p: any) => (
                    <div
                      key={p.product_uuid}
                      className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 px-2 rounded-lg hover:bg-slate-50 transition-colors gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{p.name}</p>
                        <p className="text-xs text-slate-400 truncate">
                          ID: {p.product_uuid?.slice(0, 8)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-red-600 font-semibold">{p.stock} left</span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((p.stock / 20) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Sales & Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {[
          {
            title: "Recent Sales",
            icon: cartOutline,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-500",
            badgeClass: "bg-slate-100 text-slate-600",
            items: data.recent_sales?.slice(0, 5) ?? [],
            emptyMsg: "No recent sales",
            keyField: "sale_uuid",
            nameField: (s: any) => s.invoice_number,
            dateField: (s: any) => format(new Date(s.created_at), "dd MMM yyyy"),
            amountField: (s: any) => formatCompactNumber(Number(s.grand_total)),
            amountColor: "text-emerald-600",
          },
          {
            title: "Recent Purchases",
            icon: cubeOutline,
            iconBg: "bg-purple-100",
            iconColor: "text-purple-500",
            badgeClass: "bg-slate-100 text-slate-600",
            items: data.recent_purchases?.slice(0, 5) ?? [],
            emptyMsg: "No recent purchases",
            keyField: "purchase_uuid",
            nameField: (p: any) => p.supplier?.name || "Supplier",
            dateField: (p: any) => format(new Date(p.created_at), "dd MMM yyyy"),
            amountField: (p: any) => formatCompactNumber(Number(p.total)),
            amountColor: "text-purple-600",
          },
        ].map((section) => (
          <Card key={section.title} className="shadow-sm border-slate-200 rounded-2xl min-w-0">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <div className={`p-1 ${section.iconBg} rounded-lg shrink-0 flex items-center justify-center`}>
                    <IonIcon icon={section.icon} className={`${section.iconColor} text-lg`} />
                  </div>
                  {section.title}
                </CardTitle>
                <Badge variant="secondary" className={section.badgeClass}>
                  Last 5
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px] pr-2">
                {section.items.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    {section.emptyMsg}
                  </div>
                ) : (
                  section.items.map((item: any) => (
                    <div
                      key={item[section.keyField]}
                      className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 px-2 rounded-lg hover:bg-slate-50 transition-colors gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">
                          {section.nameField(item)}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <IonIcon icon={timeOutline} className="text-xs shrink-0" />
                          {section.dateField(item)}
                        </p>
                      </div>
                      <span className={`font-semibold ${section.amountColor} text-base shrink-0`}>
                        ₹{section.amountField(item)}
                      </span>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
