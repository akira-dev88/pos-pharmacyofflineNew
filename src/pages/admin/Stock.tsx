import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getStock, updateStock } from "../../renderer/services/stockApi";
import { IonIcon } from "@ionic/react";
import {
  refreshOutline,
  checkmarkCircleOutline,
  warningOutline,
  closeCircleOutline,
  createOutline,
  closeOutline,
  cubeOutline,
  trendingUpOutline,
  searchOutline,
  saveOutline,
} from "ionicons/icons";

// shadcn/ui components
import { Card, CardContent } from "../../../@/components/ui/card";
import { Input } from "../../../@/components/ui/input";
import { Button } from "../../../@/components/ui/button";
import { Badge } from "../../../@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────
interface StockItem {
  product_uuid: string;
  name: string;
  stock: number;
  sku?: string;
  unit?: string;
}

export default function Stock() {
  const { t } = useTranslation();
  const [items, setItems] = useState<StockItem[]>([]);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "ok">("all");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Dashboard stats
  const totalProducts = items.length;
  const lowStockCount = items.filter((item) => item.stock < 10 && item.stock > 0).length;
  const outOfStockCount = items.filter((item) => item.stock === 0).length;
  const totalStock = items.reduce((sum, item) => sum + (item.stock || 0), 0);

  // Load stock data
  const loadStock = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStock();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Stock load error:", err);
      setError(err.message || t('stock.loadError'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      setLoading(true);
      setError(null);
      await updateStock(editingItem.product_uuid, newStock);
      setModalOpen(false);
      setEditingItem(null);
      setNewStock(0);
      await loadStock();
    } catch (err: any) {
      console.error("Stock update error:", err);
      setError(err.message || t('stock.updateError'));
    } finally {
      setLoading(false);
    }
  };

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ? true :
        filterStatus === "low" ? (item.stock < 10 && item.stock > 0) :
          item.stock >= 10;
    return matchesSearch && matchesStatus;
  });

  // Stat Card component
  const StatCard = ({ label, value, delta, gradient, icon }: any) => (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} group cursor-default text-white`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">{label}</p>
          <p className="text-3xl font-bold mt-0.5">{value}</p>
          {delta && <p className="text-xs mt-1.5 opacity-80">{delta}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">{icon}</div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors" />
    </div>
  );

  // Helper to get status badge
  const getStatusBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="flex items-center justify-center gap-1 p-1 w-fit">
          <IonIcon icon={closeCircleOutline} className="text-xs" />
          {t('stock.outOfStockLabel')}
        </Badge>
      );
    }
    if (stock < 10) {
      return (
        <Badge variant="secondary" className="flex items-center justify-center gap-1 p-1 w-fit bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
          <IonIcon icon={warningOutline} className="text-xs" />
          {t('stock.lowStockLabel')}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center justify-center gap-1 p-1 w-fit bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
        <IonIcon icon={checkmarkCircleOutline} className="text-xs" />
        {t('stock.inStockLabel')}
      </Badge>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('stock.title')}</h1>
          <Button onClick={loadStock} className="gap-2">
            <IonIcon icon={refreshOutline} className="text-lg" />
            {t('stock.retry')}
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <IonIcon icon={warningOutline} className="text-5xl text-red-500 mx-auto mb-4" />
            <p className="text-red-700 font-medium">{error}</p>
            <p className="text-red-600 text-sm mt-2">{t('stock.checkConnection')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-start">{t('stock.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('stock.subtitle')}</p>
        </div>
        <Button onClick={loadStock} disabled={loading} variant="outline" className="gap-2">
          <IonIcon icon={refreshOutline} className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          {t('stock.refresh')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 text-start">
        <StatCard
          label="Total Products"
          value={totalProducts}
          delta="In master database"
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          label="Total Stock"
          value={totalStock.toLocaleString()}
          delta="Units across batches"
          gradient="bg-gradient-to-br from-violet-500 to-violet-700"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Low Stock"
          value={lowStockCount}
          delta="Below threshold"
          gradient="bg-gradient-to-br from-amber-500 to-amber-700"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          label="Out of Stock"
          value={outOfStockCount}
          delta="Needs restock"
          gradient="bg-gradient-to-br from-red-500 to-rose-700"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IonIcon icon={searchOutline} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <Input
            placeholder={t('stock.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-10 py-2.5 bg-white border-slate-200 rounded-xl focus:border-black transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <IonIcon icon={closeOutline} className="text-lg" />
            </button>
          )}
        </div>

        <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
          <SelectTrigger className="max-w-[180px] bg-white border-slate-200 rounded-xl">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent
            className="bg-white border-slate-200 rounded-xl overflow-hidden mt-1 font-medium"
            style={{ width: 'var(--radix-select-trigger-width)' }}
          >
            <SelectItem value="all" className="px-4 py-2.5 text-slate-700 focus:bg-slate-50 cursor-pointer">
              All Products
            </SelectItem>
            <SelectItem value="low" className="px-4 py-2.5 text-amber-700 focus:bg-amber-50 cursor-pointer">
              Low Stock
            </SelectItem>
            <SelectItem value="ok" className="px-4 py-2.5 text-emerald-700 focus:bg-emerald-50 cursor-pointer">
              In Stock
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="text-left text-slate-600 w-[40%]">Product</TableHead>
                <TableHead className="text-right text-slate-600 w-[9%]">Current Stock</TableHead>
                <TableHead className="text-center text-slate-600 w-[20%]">Status</TableHead>
                <TableHead className="text-center text-slate-600 w-[15%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                      <p className="text-slate-500 text-sm">{t('stock.loadingData')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                    {searchTerm ? t('stock.noSearchResults') : t('stock.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const stock = item.stock;
                  const isLow = stock < 10 && stock > 0;
                  const isOut = stock === 0;
                  const stockPercentage = Math.min((stock / 50) * 100, 100);

                  return (
                    <TableRow key={item.product_uuid} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <TableCell className="text-left">
                        <div>
                          <div className="font-bold font-inter text-slate-800">{item.name}</div>
                          {item.sku && (
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{t('stock.skuLabel')}: {item.sku}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <span className={`text-xl font-bold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-600"}`}>
                            {stock}
                          </span>
                          {item.unit && <span className="text-xs text-slate-400 ml-1">{item.unit}</span>}
                          <div className="w-32 ml-auto mt-2">
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isOut ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${stockPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center items-center flex justify-center">
                        {getStatusBadge(stock)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingItem(item);
                            setNewStock(item.stock);
                            setModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title={t('stock.updateTitle')}
                        >
                          <IonIcon icon={createOutline} className="text-lg" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Low Stock Alert Footer */}
      {lowStockCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <IonIcon icon={warningOutline} className="text-amber-600 text-xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">{t('stock.lowStockAlert')}</p>
                <p className="text-xs text-amber-700">
                  {t('stock.lowStockMessage', { count: lowStockCount })}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setFilterStatus("low")}
              variant="default"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {t('stock.viewLowStock')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Stock Modal */}
      {modalOpen && editingItem && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Update Stock</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <IonIcon icon={closeOutline} className="text-2xl" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Product Details</p>
                <p className="text-base font-semibold text-slate-800">{editingItem.name}</p>
                {editingItem.sku && (
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {t('stock.skuLabel')}: {editingItem.sku}
                  </p>
                )}
              </div>

              {/* Current Stock (highlighted) */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 text-center">Current Stock</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-3xl font-bold text-slate-900">{editingItem.stock}</span>
                  {editingItem.unit && (
                    <span className="text-sm text-slate-500 font-medium">{editingItem.unit}</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Stock Quantity</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-lg border-slate-200 hover:bg-slate-50"
                    onClick={() => setNewStock(prev => Math.max(0, prev - 1))}
                    disabled={newStock <= 0}
                  >
                    <span className="text-lg font-bold">−</span>
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(Math.max(0, Number(e.target.value)))}
                    className="w-full text-center text-lg font-semibold bg-white border-slate-300 text-slate-900 focus:outline-none focus:ring-0 focus:border-slate-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-lg border-slate-200 hover:bg-slate-50"
                    onClick={() => setNewStock(prev => prev + 1)}
                  >
                    <span className="text-lg font-bold">+</span>
                  </Button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      {/* <IonIcon icon={saveOutline} className="text-lg mr-2" /> */}
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}