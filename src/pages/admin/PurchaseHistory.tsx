import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPurchases } from "../../renderer/services/purchaseApi";
import { IonIcon } from "@ionic/react";
import {
  cartOutline,
  cashOutline,
  calendarOutline,
  peopleOutline,
  closeOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  warningOutline,
  timeOutline,
} from "ionicons/icons";

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Reusable StatCard (matches other pages)
const StatCard = ({ label, value, gradient, icon }: any) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} group cursor-default text-white min-w-0`}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1 truncate">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold mt-0.5 truncate">{value}</p>
      </div>
      <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors" />
  </div>
);

export default function PurchaseHistory() {
  const { t } = useTranslation();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPurchases();
      
      let purchasesData = [];
      if (Array.isArray(response)) purchasesData = response;
      else if (response.data && Array.isArray(response.data)) purchasesData = response.data;
      else if (response.success && response.data && Array.isArray(response.data)) purchasesData = response.data;
      else if (response.purchases && Array.isArray(response.purchases)) purchasesData = response.purchases;
      else purchasesData = [];
      
      setPurchases(purchasesData);
    } catch (e) {
      console.error("Error loading purchases:", e);
      setError(t('purchaseHistory.loadError'));
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPurchases = purchases.length;
  const totalSpent = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const averagePurchase = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

  const formatNumber = (value: any) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-start">{t('purchaseHistory.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('purchaseHistory.subtitle')}</p>
        </div>
        <Button onClick={load} className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white gap-2">
          <IonIcon icon={cartOutline} className="text-xl" />
          {t('purchaseHistory.refresh')}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-red-700">
              <IonIcon icon={warningOutline} className="text-xl" />
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <IonIcon icon={closeOutline} className="text-lg" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-start">
        <StatCard
          label={t('purchaseHistory.totalPurchases')}
          value={totalPurchases}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          icon={<IonIcon icon={cartOutline} className="w-5 h-5 text-white" />}
        />
        <StatCard
          label={t('purchaseHistory.totalSpent')}
          value={`₹${formatNumber(totalSpent).toLocaleString()}`}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          icon={<IonIcon icon={cashOutline} className="w-5 h-5 text-white" />}
        />
        <StatCard
          label={t('purchaseHistory.averagePurchase')}
          value={`₹${formatNumber(averagePurchase).toFixed(0)}`}
          gradient="bg-gradient-to-br from-violet-500 to-violet-700"
          icon={<IonIcon icon={documentTextOutline} className="w-5 h-5 text-white" />}
        />
      </div>

      {/* Purchases Table */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-white">
              <IonIcon icon={cartOutline} className="text-xl" />
              {t('purchaseHistory.purchaseOrders')}
            </CardTitle>
            <span className="text-gray-300 text-sm">
              {t('purchaseHistory.recordsCount', { count: purchases.length })}
            </span>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead className="text-slate-600 min-w-[180px]">{t('purchaseHistory.tableSupplier')}</TableHead>
                  <TableHead className="text-slate-600 min-w-[150px]">{t('purchaseHistory.tableItems')}</TableHead>
                  <TableHead className="text-right text-slate-600 min-w-[120px] text-center">{t('purchaseHistory.tableTotalAmount')}</TableHead>
                  <TableHead className="text-slate-600 min-w-[160px]">{t('purchaseHistory.tableDate')}</TableHead>
                  <TableHead className="text-slate-600 min-w-[100px] text-start">{t('purchaseHistory.tableStatus')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className=" py-12 text-slate-500">
                      <div className="flex flex-col gap-2">
                        <IonIcon icon={cartOutline} className="text-6xl text-slate-300" />
                        <p className="text-lg">{t('purchaseHistory.noPurchases')}</p>
                        <p className="text-sm">{t('purchaseHistory.noPurchasesSubtext')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.map((purchase) => (
                    <TableRow
                      key={purchase.purchase_uuid || purchase.id}
                      onClick={() => setSelected(purchase)}
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex  gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {purchase.supplier?.name?.charAt(0).toUpperCase() || 
                             purchase.supplier_name?.charAt(0).toUpperCase() || 
                             "W"}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">
                              {purchase.supplier?.name || purchase.supplier_name || t('purchaseHistory.walkInSupplier')}
                            </div>
                            {purchase.supplier?.phone && (
                              <div className="text-xs text-slate-400">{purchase.supplier.phone}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-start text-slate-600">
                          {t('purchaseHistory.itemsCount', { count: purchase.items?.length || 0 })}
                        </div>
                        <div className="text-xs text-start text-slate-400 truncate max-w-[200px]">
                          {purchase.items?.slice(0, 2).map((item: any) => 
                            item.product?.name || item.name
                          ).join(", ")}
                          {purchase.items?.length > 2 && "..."}
                        </div>
                      </TableCell>
                      <TableCell className="">
                        <span className="font-semibold text-emerald-600">₹{formatNumber(purchase.total).toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <IonIcon icon={calendarOutline} className="text-xs" />
                          <span>{purchase.created_at ? new Date(purchase.created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <IonIcon icon={timeOutline} className="text-xs" />
                          <span>{purchase.created_at ? new Date(purchase.created_at).toLocaleTimeString() : 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                          <IonIcon icon={checkmarkCircleOutline} className="text-xs mr-1" />
                          {t('purchaseHistory.statusCompleted')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </div>
      </Card>

      {/* Purchase Details Modal - Premium Dark Design (same as supplier modal) */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-6 py-4 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <IonIcon icon={documentTextOutline} className="text-gray-400 text-xl" />
                  <h2 className="text-xl font-bold text-white">{t('purchaseHistory.purchaseDetails')}</h2>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {t('purchaseHistory.orderNumber')} #{selected.purchase_uuid?.slice(0, 8).toUpperCase() || 'N/A'}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-200 transition-colors">
                <IonIcon icon={closeOutline} className="text-2xl" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Supplier Info */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <IonIcon icon={peopleOutline} className="text-blue-400 text-lg" />
                  <h3 className="font-semibold text-gray-200">{t('purchaseHistory.supplierInformation')}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('purchaseHistory.nameLabel')}:</span>
                    <span className="font-medium text-gray-200">
                      {selected.supplier?.name || selected.supplier_name || t('purchaseHistory.walkInSupplier')}
                    </span>
                  </div>
                  {selected.supplier?.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('purchaseHistory.phoneLabel')}:</span>
                      <span className="text-gray-200">{selected.supplier.phone}</span>
                    </div>
                  )}
                  {selected.supplier?.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('purchaseHistory.emailLabel')}:</span>
                      <span className="text-gray-200">{selected.supplier.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase Info */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <IonIcon icon={calendarOutline} className="text-blue-400 text-lg" />
                  <h3 className="font-semibold text-gray-200">{t('purchaseHistory.purchaseInformation')}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('purchaseHistory.dateLabel')}:</span>
                    <span className="text-gray-200">
                      {selected.created_at ? new Date(selected.created_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('purchaseHistory.itemsLabel')}:</span>
                    <span className="text-gray-200">{t('purchaseHistory.productsCount', { count: selected.items?.length || 0 })}</span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <IonIcon icon={cartOutline} className="text-blue-400 text-lg" />
                  <h3 className="font-semibold text-gray-200">{t('purchaseHistory.itemsPurchased')}</h3>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-3 text-xs font-semibold text-gray-400 pb-2 mb-2 border-b border-gray-700">
                    <span>{t('purchaseHistory.productLabel')}</span>
                    <span className="text-center">{t('purchaseHistory.quantityLabel')}</span>
                    <span className="text-right">{t('purchaseHistory.costPriceLabel')}</span>
                  </div>
                  {selected.items && selected.items.length > 0 ? (
                    selected.items.map((item: any, i: number) => (
                      <div key={i} className="grid grid-cols-3 text-sm py-2 border-b border-gray-700 last:border-0">
                        <span className="text-gray-200">{item.product?.name || item.name || t('purchaseHistory.unknownProduct')}</span>
                        <span className="text-center text-gray-400">x{item.quantity || 0}</span>
                        <span className="text-right text-emerald-400 font-medium">₹{formatNumber(item.cost_price).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-4">{t('purchaseHistory.noItemDetails')}</div>
                  )}
                </ScrollArea>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 rounded-xl p-4 border border-emerald-800/50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-300">{t('purchaseHistory.totalAmountLabel')}</p>
                    <p className="text-xs text-gray-400">{t('purchaseHistory.includingAllItems')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-emerald-400">₹{formatNumber(selected.total).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 px-6 py-4 rounded-b-2xl">
              <Button onClick={() => setSelected(null)} className="w-full bg-gray-700 hover:bg-gray-600 text-white">
                {t('common.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
