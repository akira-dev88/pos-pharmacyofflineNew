import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getTopProducts,
  getStockReport,
  getProfitReport,
  getDashboardReport,
  getSalesTrend,
  getProfitTrend,
  getSalesByPayment,
  getDailySales,
  getProductSalesReport,
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

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

      if (dashboardRes.status === "fulfilled") {
        setDashboard(dashboardRes.value);
      }

      if (topRes.status === "fulfilled" && Array.isArray(topRes.value)) {
        setTop(topRes.value);
      } else {
        setTop([]);
      }

      if (stockRes.status === "fulfilled" && Array.isArray(stockRes.value)) {
        setStock(stockRes.value);
      } else {
        setStock([]);
      }

      if (profitRes.status === "fulfilled" && profitRes.value) {
        setProfit({
          revenue: profitRes.value.revenue || 0,
          cost: profitRes.value.cost || 0,
          profit: profitRes.value.profit || 0,
        });
      }

      if (salesTrendRes.status === "fulfilled" && Array.isArray(salesTrendRes.value)) {
        setSalesTrend(salesTrendRes.value);
      }

      if (profitTrendRes.status === "fulfilled" && Array.isArray(profitTrendRes.value)) {
        setProfitTrend(profitTrendRes.value);
      }

      if (paymentRes.status === "fulfilled" && Array.isArray(paymentRes.value)) {
        setPaymentMethods(paymentRes.value);
      }

      if (customerRes.status === "fulfilled" && Array.isArray(customerRes.value)) {
        setCustomerReport(customerRes.value);
      }

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

  const handleRefresh = () => {
    loadReports();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">{t('reports.loadingReports')}</p>
        </div>
      </div>
    );
  }

  const profitMargin = profit.revenue > 0 ? (profit.profit / profit.revenue) * 100 : 0;
  const lowStockCount = stock.filter((s: any) => s.stock <= 10 && s.stock > 0).length;
  const outOfStockCount = stock.filter((s: any) => s.stock === 0).length;

  return (
    <div className="space-y-6 text-start">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('reports.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('reports.subtitle')}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          <IonIcon icon={refreshOutline} className={`text-xl ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? t('reports.refreshing') : t('reports.refresh')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: "overview", label: "Overview", icon: barChartOutline },
          { id: "sales", label: "Sales", icon: cartOutline },
          { id: "inventory", label: "Inventory", icon: cubeOutline },
          { id: "customers", label: "Customers", icon: peopleOutline },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
          >
            <IonIcon icon={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IonIcon icon={warningOutline} className="text-xl" />
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-yellow-600 hover:text-yellow-800">
              {t('reports.dismiss')}
            </button>
          </div>
        </div>
      )}

      {/* ========== OVERVIEW TAB ========== */}
      {activeTab === "overview" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-sm">Today's Sales</p>
                  <p className="text-2xl font-bold mt-1">₹{dashboard.today_sales?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <IonIcon icon={cashOutline} className="text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm">This Month</p>
                  <p className="text-2xl font-bold mt-1">₹{dashboard.month_sales?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <IonIcon icon={calendarOutline} className="text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-purple-100 text-sm">Total Sales</p>
                  <p className="text-2xl font-bold mt-1">₹{dashboard.total_sales?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <IonIcon icon={trendingUpOutline} className="text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-orange-100 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold mt-1">{dashboard.total_orders || 0}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <IonIcon icon={cartOutline} className="text-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Profit Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-sm">Revenue</p>
                  <p className="text-2xl font-bold mt-1">₹{profit.revenue?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <IonIcon icon={cashOutline} className="text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-red-100 text-sm">Cost</p>
                  <p className="text-2xl font-bold mt-1">₹{profit.cost?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <IonIcon icon={cartOutline} className="text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm">Net Profit</p>
                  <p className="text-2xl font-bold mt-1">₹{profit.profit?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <IonIcon icon={trendingUpOutline} className="text-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Profit Margin */}
          {profit.revenue > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm">Profit Margin</p>
                  <p className="text-3xl font-bold text-blue-600">{profitMargin.toFixed(1)}%</p>
                </div>
                <div className="w-64">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.min(profitMargin, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sales Trend Chart */}
          {salesTrend.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <IonIcon icon={pulseOutline} className="text-blue-500" />
                Sales Trend (Last 7 Days)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#10B981" name="Sales" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Payment Methods Pie Chart */}
          {paymentMethods.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    dataKey="total"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ₹${value?.toLocaleString() || 0}`}
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₹${value?.toLocaleString() || 0}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* ========== SALES TAB ========== */}
      {activeTab === "sales" && (
        <>
          {/* Top Selling Products */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <div className="flex items-center gap-2">
                <IonIcon icon={trophyOutline} className="text-white text-xl" />
                <h2 className="text-white font-semibold text-lg">Top Selling Products</h2>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {top.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <IonIcon icon={cubeOutline} className="text-5xl mx-auto mb-3" />
                  <p>No sales data yet</p>
                  <p className="text-sm mt-1">Complete some sales to see top products</p>
                </div>
              ) : (
                top.map((p, idx) => (
                  <div key={p.product_uuid || idx} className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? "bg-yellow-100 text-yellow-600" :
                          idx === 1 ? "bg-gray-100 text-gray-600" :
                            idx === 2 ? "bg-orange-100 text-orange-600" :
                              "bg-blue-100 text-blue-600"
                        }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{p.name || 'Unknown'}</p>
                        {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">{p.total_qty || 0} units</p>
                      {p.total_revenue && <p className="text-xs text-green-600">₹{p.total_revenue.toLocaleString()}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Sales */}
          {dashboard.recent_sales?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-white font-semibold text-lg">Recent Sales</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {dashboard.recent_sales.map((sale: any, idx: number) => (
                  <div key={idx} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">Invoice: {sale.invoice_number || sale.sale_uuid?.slice(0, 8)}</p>
                        <p className="text-xs text-gray-400">
                          {sale.customer_name || 'Walk-in Customer'} • {new Date(sale.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₹{sale.grand_total?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales by Payment */}
          {paymentMethods.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h2 className="text-white font-semibold text-lg">Sales by Payment Method</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {paymentMethods.map((method, idx) => (
                  <div key={idx} className="flex justify-between items-center px-6 py-4">
                    <span className="capitalize font-medium text-gray-700">{method.method}</span>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">₹{method.total?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-400">{method.count} transactions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========== INVENTORY TAB ========== */}
      {activeTab === "inventory" && (
        <>
          {/* Stock Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-sm">Total Products</p>
                  <p className="text-2xl font-bold mt-1">{stock.length}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <IonIcon icon={cubeOutline} className="text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-orange-100 text-sm">Low Stock</p>
                  <p className="text-2xl font-bold mt-1">{lowStockCount}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <IonIcon icon={warningOutline} className="text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-red-100 text-sm">Out of Stock</p>
                  <p className="text-2xl font-bold mt-1">{outOfStockCount}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <IonIcon icon={closeCircleOutline} className="text-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Stock List */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <div className="flex items-center gap-2">
                <IonIcon icon={cubeOutline} className="text-white text-xl" />
                <h2 className="text-white font-semibold text-lg">Inventory Status</h2>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {stock.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <IonIcon icon={cubeOutline} className="text-5xl mx-auto mb-3" />
                  <p>No products found</p>
                </div>
              ) : (
                stock.map((s, i) => {
                  const stockLevel = s.stock || 0;
                  const isLow = stockLevel <= 10 && stockLevel > 0;
                  const isOut = stockLevel === 0;
                  const stockPercentage = Math.min((stockLevel / 100) * 100, 100);

                  return (
                    <div key={s.product_uuid || i} className="px-6 py-4 hover:bg-gray-50 transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-medium text-gray-800">{s.name || 'Unknown'}</p>
                          {s.sku && <p className="text-xs text-gray-400">SKU: {s.sku}</p>}
                        </div>
                        <div className="text-right">
                          <span className={`font-semibold ${isOut ? "text-red-600" : isLow ? "text-orange-600" : "text-green-600"
                            }`}>
                            {stockLevel} units
                          </span>
                          <div className="mt-1">
                            {isOut ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                <IonIcon icon={closeCircleOutline} className="text-xs" />
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                <IonIcon icon={warningOutline} className="text-xs" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                <IonIcon icon={checkmarkCircleOutline} className="text-xs" />
                                In Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {!isOut && (
                        <div className="w-full mt-2">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isLow ? "bg-orange-500" : "bg-green-500"}`}
                              style={{ width: `${stockPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Purchases */}
          {dashboard.recent_purchases?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h2 className="text-white font-semibold text-lg">Recent Purchases</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {dashboard.recent_purchases.map((purchase: any, idx: number) => (
                  <div key={idx} className="px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">Purchase #{purchase.purchase_uuid?.slice(0, 8)}</p>
                        <p className="text-xs text-gray-400">
                          {purchase.supplier_name || 'Unknown Supplier'} • {new Date(purchase.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">₹{purchase.total?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========== CUSTOMERS TAB ========== */}
      {activeTab === "customers" && (
        <>
          {/* Customer Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm">Total Customers</p>
                  <p className="text-2xl font-bold mt-1">{customerReport.length}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <IonIcon icon={peopleOutline} className="text-2xl" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-100 text-sm">Total Credit Balance</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{customerReport.reduce((sum, c) => sum + (c.credit_balance || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <IonIcon icon={walletOutline} className="text-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
              <h2 className="text-white font-semibold text-lg">Top Customers</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {customerReport.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <IonIcon icon={peopleOutline} className="text-5xl mx-auto mb-3" />
                  <p>No customers yet</p>
                </div>
              ) : (
                customerReport.slice(0, 10).map((customer, idx) => (
                  <div key={customer.customer_uuid || idx} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{customer.name}</p>
                          {customer.mobile && <p className="text-xs text-gray-400">{customer.mobile}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">₹{customer.total_spent?.toLocaleString() || 0}</p>
                        <p className="text-xs text-gray-400">{customer.purchase_count || 0} purchases</p>
                        {customer.credit_balance > 0 && (
                          <p className="text-xs text-orange-600">Due: ₹{customer.credit_balance}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}