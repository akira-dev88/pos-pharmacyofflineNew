import { useEffect, useState, useCallback } from "react";
import { getDashboardReport } from "../../renderer/services/reportApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { getSalesTrend } from "../../renderer/services/reportApi";
import { getProfitTrend } from "../../renderer/services/reportApi";
import { getCustomerSummary } from "../../renderer/services/customerApi";
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

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profitTrend, setProfitTrend] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [customerSummary, setCustomerSummary] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to load all dashboard data
  const loadAllData = useCallback(async () => {
    console.log("🔄 Dashboard: Loading all data...");
    setLoading(true);
    try {
      // Load dashboard report
      const report = await getDashboardReport();
      if (report) {
        console.log("📊 Dashboard report loaded:", report);
        setData(report);
      } else {
        console.error('No data received from dashboard API');
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
      }

      // Load customer summary - THIS IS CRITICAL
      const summary = await getCustomerSummary();
      console.log("👥 Customer summary loaded:", summary);
      console.log("💰 Total credit value:", summary?.total_credit);
      setCustomerSummary(summary);

      // Load sales trend
      const salesTrend = await getSalesTrend();
      if (salesTrend && Array.isArray(salesTrend)) {
        const formatted = salesTrend.map((d: any) => ({
          ...d,
          date: d.date ? new Date(d.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }) : "Invalid Date",
        }));
        setTrend(formatted);
      }

      // Load profit trend
      const profitData = await getProfitTrend();
      if (profitData && Array.isArray(profitData)) {
        const formatted = profitData.map((d: any) => ({
          ...d,
          date: d.date ? new Date(d.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          }) : "Invalid Date",
        }));
        setProfitTrend(formatted);
      }
    } catch (err) {
      console.error('Dashboard data error:', err);
      // Set default values on error
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
      setCustomerSummary({ total_credit: 0, customers_with_credit: 0, top_debtors: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and refresh when trigger changes
  useEffect(() => {
    loadAllData();
  }, [refreshTrigger, loadAllData]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log("📢 Received refresh-dashboard event, refreshing...");
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('refresh-dashboard', handleRefresh);
    console.log("✅ Dashboard event listener registered");

    return () => {
      window.removeEventListener('refresh-dashboard', handleRefresh);
    };
  }, []);

  // Helper function to format numbers
  const formatCompactNumber = (num: number): string => {
    if (num === null || num === undefined) return "0";
    const absNum = Math.abs(num);
    if (absNum >= 10000000) {
      return (num / 10000000).toFixed(2) + "cr";
    } else if (absNum >= 100000) {
      return (num / 100000).toFixed(2) + "L";
    } else if (absNum >= 1000) {
      return (num / 1000).toFixed(2) + "k";
    } else {
      return num.toFixed(2);
    }
  };

  // Helper function to get subtitle based on value
  const getSubtitle = (value: number, type: string): string => {
    if (type === 'orders') {
      return `${value} orders processed`;
    }
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Crores`;
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} Lakhs`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(2)} Thousand`;
    }
    return "";
  };

  if (loading && !data) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!data) return (
    <div className="text-red-500 text-center p-8">Failed to load data</div>
  );

  // KPI Card Component
  const getGradient = (color: string) => {
    const gradients: Record<string, string> = {
      'text-green-600': 'from-green-500 to-green-600',
      'text-blue-600': 'from-blue-500 to-blue-600',
      'text-purple-600': 'from-purple-500 to-purple-600',
      'text-orange-600': 'from-orange-500 to-orange-600',
      'text-red-600': 'from-red-500 to-red-600',
    };
    return gradients[color] || 'from-gray-500 to-gray-600';
  };

  const KPICard = ({ title, value, icon, color, subtitle, compactValue, isMonetary = true }: any) => (
    <div className={`bg-gradient-to-br ${getGradient(color)} rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div className="text-start">
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            {isMonetary && <span className="text-xs text-white/60 font-medium">₹</span>}
            <p className="text-3xl font-bold text-white tracking-tight">
              {compactValue || formatCompactNumber(Number(value))}
            </p>
          </div>
          {subtitle && <p className="text-white/70 text-xs mt-2 font-medium">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <IonIcon icon={icon} className="text-2xl text-white" />
        </div>
      </div>
    </div>
  );

  // Get the current credit total (with fallback)
  const currentTotalCredit = customerSummary?.total_credit ?? 0;
  const currentCustomersWithCredit = customerSummary?.customers_with_credit ?? 0;
  const currentTopDebtors = customerSummary?.top_debtors ?? [];

  console.log("🎨 Rendering Dashboard with credit total:", currentTotalCredit);

  return (
    <div className="space-y-3 p-4 min-h-screen">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white font-inter">Dashboard</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button
            onClick={() => {
              console.log("🔘 Manual refresh clicked");
              setRefreshTrigger(prev => prev + 1);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Today's Sales"
          value={data.today_sales || 0}
          compactValue={formatCompactNumber(data.today_sales || 0)}
          icon={cashOutline}
          color="text-green-600"
          subtitle={getSubtitle(data.today_sales || 0, 'sales')}
        />

        <KPICard
          title="Monthly Sales"
          value={data.month_sales || 0}
          compactValue={formatCompactNumber(data.month_sales || 0)}
          icon={trendingUpOutline}
          color="text-blue-600"
          subtitle={getSubtitle(data.month_sales || 0, 'sales')}
        />

        <KPICard
          title="Total Sales"
          value={data.total_sales || 0}
          compactValue={formatCompactNumber(data.total_sales || 0)}
          icon={cartOutline}
          color="text-purple-600"
          subtitle={getSubtitle(data.total_sales || 0, 'sales')}
        />

        <KPICard
          title="Total Orders"
          value={data.total_orders || 0}
          compactValue={data.total_orders?.toLocaleString() || "0"}
          icon={cubeOutline}
          color="text-orange-600"
          subtitle={`${data.total_orders || 0} orders processed`}
          isMonetary={false}
        />
      </div>

      {/* Credit Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-1 space-y-3">
          {/* Total Credit Card */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white text-start hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-red-100 text-sm font-medium">Total Credit Given</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-xs text-red-200">₹</span>
                  <p className="text-4xl font-bold">
                    {currentTotalCredit}  {/* 👈 raw number, no formatting */}
                  </p>
                </div>
                <p className="text-red-100 text-sm mt-2">
                  {currentCustomersWithCredit} customers have outstanding dues
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <IonIcon icon={peopleOutline} className="text-2xl" />
              </div>
            </div>
          </div>

          {/* Top Debtors */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="p-1 bg-red-100 rounded-lg">
                <IonIcon icon={warningOutline} className="text-red-500 text-lg" />
              </div>
              Top Debtors
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
              {currentTopDebtors.length > 0 ? (
                currentTopDebtors.map((c: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 hover:bg-gray-50 px-2 rounded-lg transition-all duration-200 hover:translate-x-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${i === 0 ? 'bg-yellow-100 text-yellow-600' :
                        i === 1 ? 'bg-gray-100 text-gray-600' :
                          i === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                        {i + 1}
                      </div>
                      <span className="text-gray-700 font-medium">{c.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-red-600">₹{formatCompactNumber(c.credit_balance)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-center py-8 flex flex-col items-center gap-2">
                  <IonIcon icon={checkmarkCircleOutline} className="text-4xl text-green-500" />
                  <p>No debtors found</p>
                  <p className="text-xs">All customers have cleared their dues</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profit Trend Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 h-full">
            <div className="flex justify-between items-center mb-6">
              <div className="font-inter text-start">
                <h2 className="font-semibold text-gray-800 text-lg">Profit Analysis</h2>
                <p className="text-xs text-gray-400 mt-1">Last 7 days performance</p>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-green-100 text-green-600 text-xs rounded-full flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Revenue
                </div>
                <div className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-full flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Cost
                </div>
                <div className="px-3 py-1 bg-purple-100 text-purple-600 text-xs rounded-full flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Profit
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitTrend} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} dx={-10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '12px',
                      fontSize: '12px',
                      textAlign: 'start'
                    }}
                    formatter={(value: any, name: string) => [
                      `₹${Number(value).toLocaleString()}`,
                      name.charAt(0).toUpperCase() + name.slice(1)
                    ]}
                    labelFormatter={(label) => ` ${label}`}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={10} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ fill: '#10b981', strokeWidth: 2, r: 4, stroke: '#fff' }} />
                  <Area type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2.5} fill="url(#costGradient)" dot={{ fill: '#ef4444', strokeWidth: 2, r: 4, stroke: '#fff' }} />
                  <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={3.5} dot={{ fill: '#8b5cf6', strokeWidth: 3, r: 5, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of your charts - keep the same as before */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Sales Trend Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Sales Trend</h2>
            <div className="px-3 py-1 bg-green-100 text-green-600 text-xs rounded-full font-medium">Last 7 Days</div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Sales']}
                  labelFormatter={(label) => ` ${label}`}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <div className="p-1 bg-orange-100 rounded-lg">
                <IonIcon icon={warningOutline} className="text-orange-500 text-lg" />
              </div>
              Low Stock Alert
            </h2>
            <span className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-1 rounded-full">⚠️ Needs attention</span>
          </div>
          <div className="space-y-2">
            {data.low_stock?.length === 0 ? (
              <div className="text-green-500 text-center py-8 flex items-center justify-center gap-2">
                <IonIcon icon={checkmarkCircleOutline} className="text-xl" />
                All stock levels are good
              </div>
            ) : (
              data.low_stock?.slice(0, 5).map((p: any) => (
                <div key={p.product_uuid} className="flex justify-between items-center py-3 border-b border-gray-100 hover:bg-gray-50 px-2 rounded-lg transition-all">
                  <div>
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">ID: {p.product_uuid?.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 font-semibold text-lg">{p.stock} left</span>
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${Math.min((p.stock / 20) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid - Recent Sales & Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Sales */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <div className="p-1 bg-blue-100 rounded-lg">
                <IonIcon icon={cartOutline} className="text-blue-500 text-lg" />
              </div>
              Recent Sales
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Last 5 transactions</span>
          </div>
          <div className="space-y-2">
            {data.recent_sales?.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No recent sales</div>
            ) : (
              data.recent_sales?.slice(0, 5).map((s: any) => (
                <div key={s.sale_uuid} className="flex justify-between items-center py-3 border-b border-gray-100 hover:bg-gray-50 px-3 rounded-lg transition-all duration-200 hover:translate-x-1">
                  <div>
                    <p className="font-medium text-gray-800">{s.invoice_number}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <IonIcon icon={timeOutline} className="text-xs" />
                      {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-semibold text-green-600 text-lg">₹{formatCompactNumber(Number(s.grand_total))}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <div className="p-1 bg-purple-100 rounded-lg">
                <IonIcon icon={cubeOutline} className="text-purple-500 text-lg" />
              </div>
              Recent Purchases
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Last 5 purchases</span>
          </div>
          <div className="space-y-2">
            {data.recent_purchases?.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No purchases recorded</div>
            ) : (
              data.recent_purchases?.slice(0, 5).map((p: any) => (
                <div key={p.purchase_uuid} className="flex justify-between items-center py-3 border-b border-gray-100 hover:bg-gray-50 px-3 rounded-lg transition-all duration-200 hover:translate-x-1">
                  <div>
                    <p className="font-medium text-gray-800">{p.supplier?.name || "Supplier"}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <IonIcon icon={timeOutline} className="text-xs" />
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-semibold text-purple-600 text-lg">₹{formatCompactNumber(Number(p.total))}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}