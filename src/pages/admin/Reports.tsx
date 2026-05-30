import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  getTopProducts,
  getStockReport,
  getProfitReport,
  getDashboardReport,
  getSalesTrend,
  getProfitTrend,
  getSalesByPayment,
  getCustomerPurchaseReport,
} from "../../renderer/services/reportApi";
import { IonIcon } from "@ionic/react";
import {
  trendingUpOutline,
  cashOutline,
  cartOutline,
  cubeOutline,
  warningOutline,
  refreshOutline,
  trophyOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  calendarOutline,
  peopleOutline,
  walletOutline,
  barChartOutline,
  pulseOutline,
} from "ionicons/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "../../../@/components/ui/card";
import { Badge } from "../../../@/components/ui/badge";
import { ScrollArea } from "../../../@/components/ui/scroll-area";
import { Button } from "../../../@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../@/components/ui/chart";

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// ── Reusable StatCard (same as other pages)
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

export default function Reports() {
  const { t } = useTranslation();
  const [top, setTop] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [profit, setProfit] = useState<any>({
    revenue: 0,
    cost: 0,
    profit: 0,
  });
  const [dashboard, setDashboard] = useState<any>({
    today_sales: 0,
    month_sales: 0,
    total_sales: 0,
    total_orders: 0,
    low_stock: [],
    recent_sales: [],
    recent_purchases: [],
    top_products: [],
  });
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [profitTrend, setProfitTrend] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [customerReport, setCustomerReport] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for sliding tabs (must be declared before any useEffect that uses them)
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const sliderRef = useRef<HTMLDivElement>(null);

  const loadReports = async () => {
    try {
      setError(null);
      setRefreshing(true);

      const [
        dashboardRes,
        topRes,
        stockRes,
        profitRes,
        salesTrendRes,
        profitTrendRes,
        paymentRes,
        customerRes,
      ] = await Promise.allSettled([
        getDashboardReport(),
        getTopProducts(),
        getStockReport(),
        getProfitReport(),
        getSalesTrend(),
        getProfitTrend(),
        getSalesByPayment(),
        getCustomerPurchaseReport(),
      ]);

      if (dashboardRes.status === "fulfilled") setDashboard(dashboardRes.value);
      if (topRes.status === "fulfilled" && Array.isArray(topRes.value)) setTop(topRes.value);
      else setTop([]);
      if (stockRes.status === "fulfilled" && Array.isArray(stockRes.value)) setStock(stockRes.value);
      else setStock([]);
      if (profitRes.status === "fulfilled" && profitRes.value) setProfit(profitRes.value);
      if (salesTrendRes.status === "fulfilled" && Array.isArray(salesTrendRes.value)) setSalesTrend(salesTrendRes.value);
      if (profitTrendRes.status === "fulfilled" && Array.isArray(profitTrendRes.value)) setProfitTrend(profitTrendRes.value);
      if (paymentRes.status === "fulfilled" && Array.isArray(paymentRes.value)) setPaymentMethods(paymentRes.value);
      if (customerRes.status === "fulfilled" && Array.isArray(customerRes.value)) setCustomerReport(customerRes.value);
    } catch (err) {
      console.error("Reports error:", err);
      setError(t('reports.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    const updateSlider = () => {
      const activeButton = tabRefs.current[activeTab];
      const slider = sliderRef.current;
      if (activeButton && slider) {
        const container = activeButton.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const activeRect = activeButton.getBoundingClientRect();
          slider.style.left = `${activeRect.left - containerRect.left}px`;
          slider.style.width = `${activeRect.width}px`;
        }
      }
    };
    // Use requestAnimationFrame to wait for the next paint
    const frameId = requestAnimationFrame(updateSlider);
    window.addEventListener("resize", updateSlider);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateSlider);
    };
  }, [activeTab, loading]);

  const handleRefresh = () => loadReports();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const profitMargin = profit.revenue > 0 ? (profit.profit / profit.revenue) * 100 : 0;
  const lowStockCount = stock.filter((s: any) => s.stock <= 10 && s.stock > 0).length;
  const outOfStockCount = stock.filter((s: any) => s.stock === 0).length;

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-start">{t('reports.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('reports.subtitle')}</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="gap-2">
          <IonIcon icon={refreshOutline} className={`text-lg ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? t('reports.refreshing') : t('reports.refresh')}
        </Button>
      </div>

      {/* Animated Sliding Tabs */}
      <div className="flex justify-center ">
        <div className="relative inline-flex gap-1 rounded-full bg-slate-100 p-1 border-black border-[1px]">
          {[
            { value: "overview", label: "Overview", icon: barChartOutline },
            { value: "sales", label: "Sales", icon: cartOutline },
            { value: "inventory", label: "Inventory", icon: cubeOutline },
            { value: "customers", label: "Customers", icon: peopleOutline },
          ].map((tab) => (
            <button
              key={tab.value}
              ref={(el) => { tabRefs.current[tab.value] = el; }}
              onClick={() => setActiveTab(tab.value)}
              className="relative z-10 rounded-full px-6 py-2 text-sm font-medium transition-colors duration-200"
              style={{
                color: activeTab === tab.value ? "white" : "#475569",
              }}
            >
              <IonIcon icon={tab.icon} className="mr-2 h-4 w-4" />
              {tab.label}
            </button>
          ))}
          <div
            ref={sliderRef}
            className="absolute top-1 bottom-1 z-0 rounded-full bg-green-600 transition-all duration-300 ease-out"
            style={{ left: 0, width: 0 }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-red-700">
              <IonIcon icon={warningOutline} className="text-xl" />
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <IonIcon icon={closeCircleOutline} className="text-lg" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* ========== OVERVIEW TAB ========== */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Today's Sales"
              value={`₹${(dashboard.today_sales || 0).toLocaleString()}`}
              delta="Last 24 hours"
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
              icon={<IonIcon icon={cashOutline} className="w-5 h-5 text-white" />}
            />
            <StatCard
              label="Monthly Sales"
              value={`₹${(dashboard.month_sales || 0).toLocaleString()}`}
              delta="This month"
              gradient="bg-gradient-to-br from-blue-500 to-blue-700"
              icon={<IonIcon icon={calendarOutline} className="w-5 h-5 text-white" />}
            />
            <StatCard
              label="Total Sales"
              value={`₹${(dashboard.total_sales || 0).toLocaleString()}`}
              delta="Lifetime revenue"
              gradient="bg-gradient-to-br from-violet-500 to-violet-700"
              icon={<IonIcon icon={trendingUpOutline} className="w-5 h-5 text-white" />}
            />
            <StatCard
              label="Total Orders"
              value={(dashboard.total_orders || 0).toLocaleString()}
              delta="Invoices processed"
              gradient="bg-gradient-to-br from-amber-500 to-amber-700"
              icon={<IonIcon icon={cartOutline} className="w-5 h-5 text-white" />}
            />
          </div>

          {/* Profit Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Revenue"
              value={`₹${(profit.revenue || 0).toLocaleString()}`}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
              icon={<IonIcon icon={cashOutline} className="w-5 h-5 text-white" />}
            />
            <StatCard
              label="Cost"
              value={`₹${(profit.cost || 0).toLocaleString()}`}
              gradient="bg-gradient-to-br from-red-500 to-red-600"
              icon={<IonIcon icon={cartOutline} className="w-5 h-5 text-white" />}
            />
            <StatCard
              label="Net Profit"
              value={`₹${(profit.profit || 0).toLocaleString()}`}
              gradient="bg-gradient-to-br from-blue-500 to-blue-700"
              icon={<IonIcon icon={trendingUpOutline} className="w-5 h-5 text-white" />}
            />
          </div>

          {/* Profit Margin Bar */}
          {profit.revenue > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-500">Profit Margin</p>
                    <p className="text-3xl font-bold text-blue-600">{profitMargin.toFixed(1)}%</p>
                  </div>
                  <div className="w-64">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(profitMargin, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sales Trend Chart */}
          {salesTrend.length > 0 && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <IonIcon icon={pulseOutline} className="text-blue-500 text-xl" />
                  Sales Trend (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    total: {
                      label: "Sales",
                      color: "#10b981",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <LineChart
                    data={salesTrend}
                    margin={{ top: 20, right: 20, left: 12, bottom: 10 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(v) => `₹${v.toLocaleString()}`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          className="rounded-xl border-slate-200 bg-white text-slate-800 shadow-xl p-2"
                          formatter={(value) => (
                            <>
                              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#10b981" }} />
                              <span className="text-slate-500">Sales</span>
                              <span className="ml-auto font-semibold text-slate-800">
                                ₹{Number(value).toLocaleString()}
                              </span>
                            </>
                          )}
                        />
                      }
                    />
                    <Line
                      dataKey="total"
                      type="monotone"
                      stroke="var(--color-total)"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4, stroke: "white" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========== SALES TAB ========== */}
      {activeTab === "sales" && (
        <div className="space-y-5">
          {/* Top Selling Products */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-white">
                <IonIcon icon={trophyOutline} className="text-xl" />
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {top.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <IonIcon icon={cubeOutline} className="text-5xl mx-auto mb-3" />
                    <p>No sales data yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {top.map((p, idx) => (
                      <div key={p.product_uuid || idx} className="flex justify-between items-center px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? "bg-yellow-100 text-yellow-600" :
                            idx === 1 ? "bg-slate-100 text-slate-600" :
                              idx === 2 ? "bg-orange-100 text-orange-600" :
                                "bg-blue-100 text-blue-600"
                            }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{p.name || 'Unknown'}</p>
                            {p.sku && <p className="text-xs text-slate-400">SKU: {p.sku}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">{p.total_qty || 0} units</p>
                          {p.total_revenue && <p className="text-xs text-emerald-600">₹{p.total_revenue.toLocaleString()}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          {dashboard.recent_sales?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl">
                <CardTitle className="text-white">Recent Sales</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="divide-y divide-slate-100">
                    {dashboard.recent_sales.map((sale: any, idx: number) => (
                      <div key={idx} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-slate-800">Invoice: {sale.invoice_number || sale.sale_uuid?.slice(0, 8)}</p>
                            <p className="text-xs text-slate-400">
                              {sale.customer_name || 'Walk-in Customer'} • {new Date(sale.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="font-bold text-emerald-600">₹{(sale.grand_total || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Sales by Payment Method */}
          {paymentMethods.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-t-2xl">
                <CardTitle className="text-white">Sales by Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {paymentMethods.map((method, idx) => (
                    <div key={idx} className="flex justify-between items-center px-6 py-4">
                      <span className="capitalize font-medium text-slate-700">{method.method}</span>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">₹{(method.total || 0).toLocaleString()}</p>
                        <p className="text-xs text-slate-400">{method.count} transactions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========== INVENTORY TAB ========== */}
      {activeTab === "inventory" && (
        <div className="space-y-5">
          {/* Stock Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Products"
              value={stock.length.toLocaleString()}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
              icon={<IonIcon icon={cubeOutline} className="w-5 h-5 text-white" />}
            />
            <StatCard
              label="Low Stock"
              value={lowStockCount}
              gradient="bg-gradient-to-br from-amber-500 to-amber-700"
              icon={<IonIcon icon={warningOutline} className="w-5 h-5 text-white" />}
            />
            <StatCard
              label="Out of Stock"
              value={outOfStockCount}
              gradient="bg-gradient-to-br from-red-500 to-red-600"
              icon={<IonIcon icon={closeCircleOutline} className="w-5 h-5 text-white" />}
            />
          </div>

          {/* Inventory Status List */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-white">
                <IonIcon icon={cubeOutline} className="text-xl" />
                Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {stock.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <IonIcon icon={cubeOutline} className="text-5xl mx-auto mb-3" />
                    <p>No products found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {stock.map((s, i) => {
                      const stockLevel = s.stock || 0;
                      const isLow = stockLevel <= 10 && stockLevel > 0;
                      const isOut = stockLevel === 0;
                      const stockPercentage = Math.min((stockLevel / 100) * 100, 100);
                      return (
                        <div key={s.product_uuid || i} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="font-medium text-slate-800">{s.name || 'Unknown'}</p>
                              {s.sku && <p className="text-xs text-slate-400">SKU: {s.sku}</p>}
                            </div>
                            <div className="text-right">
                              <span className={`font-semibold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-600"}`}>
                                {stockLevel} units
                              </span>
                              <div className="mt-1">
                                {isOut ? (
                                  <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                                ) : isLow ? (
                                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">Low Stock</Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">In Stock</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {!isOut && (
                            <div className="w-full mt-2">
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${isLow ? "bg-amber-500" : "bg-emerald-500"}`}
                                  style={{ width: `${stockPercentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Purchases */}
          {dashboard.recent_purchases?.length > 0 && (
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-t-2xl">
                <CardTitle className="text-white">Recent Purchases</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="divide-y divide-slate-100">
                    {dashboard.recent_purchases.map((purchase: any, idx: number) => (
                      <div key={idx} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-slate-800">Purchase #{purchase.purchase_uuid?.slice(0, 8)}</p>
                            <p className="text-xs text-slate-400">
                              {purchase.supplier_name || 'Unknown Supplier'} • {new Date(purchase.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="font-bold text-purple-600">₹{(purchase.total || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========== CUSTOMERS TAB ========== */}
      {activeTab === "customers" && (
        <div className="space-y-5">
          {/* Customer Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              label="Total Customers"
              value={customerReport.length.toLocaleString()}
              gradient="bg-gradient-to-br from-blue-500 to-blue-700"
              icon={<IonIcon icon={peopleOutline} className="w-5 h-5 text-white" />}
            />
            <StatCard
              label="Total Credit Balance"
              value={`₹${customerReport.reduce((sum, c) => sum + (c.credit_balance || 0), 0).toLocaleString()}`}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
              icon={<IonIcon icon={walletOutline} className="w-5 h-5 text-white" />}
            />
          </div>

          {/* Top Customers */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-t-2xl">
              <CardTitle className="text-white">Top Customers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {customerReport.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <IonIcon icon={peopleOutline} className="text-5xl mx-auto mb-3" />
                    <p>No customers yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {customerReport.slice(0, 10).map((customer, idx) => (
                      <div key={customer.customer_uuid || idx} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{customer.name}</p>
                              {customer.mobile && <p className="text-xs text-slate-400">{customer.mobile}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-600">₹{(customer.total_spent || 0).toLocaleString()}</p>
                            <p className="text-xs text-slate-400">{customer.purchase_count || 0} purchases</p>
                            {customer.credit_balance > 0 && (
                              <p className="text-xs text-amber-600">Due: ₹{customer.credit_balance}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}