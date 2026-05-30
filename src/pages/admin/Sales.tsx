import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format as formatDate } from "date-fns";        // renamed to avoid conflict
import { CalendarIcon } from "lucide-react";
import {
  getSales,
  getInvoice,
  type Invoice,
  type Sale,
} from "../../renderer/services/saleApi";
import { deleteSale } from "../../renderer/services/saleApi";
import { useAuth } from "../../context/AuthContext";
import { IonIcon } from "@ionic/react";
import {
  eyeOutline,
  closeOutline,
  cashOutline,
  calendarOutline,
  documentTextOutline,
  trendingUpOutline,
  checkmarkCircleOutline,
  searchOutline,
  trashOutline,
  refreshOutline,
} from "ionicons/icons";
import InvoiceReceipt from "../pos/components/InvoiceReceipt";

// shadcn/ui components
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Helper to format money (previously conflicted with date-fns format)
const formatMoney = (val: any) => {
  const num = Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

export default function Sales() {
  const { t } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadSales();
  }, []);

  const handleDelete = async (sale: Sale) => {
    if (!confirm(`Delete invoice ${sale.invoice_number}? Stock will be restored.`)) return;
    setDeleting(sale.sale_uuid);
    try {
      await deleteSale(sale.sale_uuid);
      await loadSales();
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = (await getSales()) as any;

      let salesData = [];
      if (Array.isArray(response)) salesData = response;
      else if (response?.data && Array.isArray(response.data)) salesData = response.data;
      else if (response?.success && response?.data && Array.isArray(response.data)) salesData = response.data;
      else if (response?.sales && Array.isArray(response.sales)) salesData = response.sales;
      else salesData = [];

      const normalised = salesData.map((sale: any) => {
        if (sale.customer?.name) return sale;
        const customerName = sale.customer_name || sale.customerName || sale.customer?.name || t('sales.walkInCustomer');
        const customerMobile = sale.mobile || sale.customer_mobile || sale.customerMobile || sale.customer?.mobile || "";
        return {
          ...sale,
          customer: {
            name: customerName,
            mobile: customerMobile,
          },
        };
      });

      setSales(normalised);
    } catch (e) {
      console.error("Sales error:", e);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const normaliseInvoice = (raw: any): any => {
    return {
      invoice_number: raw.invoice_number,
      sale_uuid: raw.sale_uuid,
      created_at: raw.created_at,
      date: raw.created_at || raw.date,
      shop: raw.shop || {
        name: "My Store",
        address: "Chennai, Tamil Nadu",
        gstin: "33ABCDE1234F1Z5",
        mobile: ""
      },
      customer: raw.customer || { name: raw.customer_name || t('sales.walkInCustomer') },
      items: (raw.items || raw.cart?.items || []).map((item: any) => ({
        name: item.name || item.product?.name,
        hsn_code: item.hsn_code || item.product?.hsn_code,
        price: Number(item.price || item.product?.price || 0),
        qty: Number(item.qty || item.quantity || 1),
        total: Number(item.total || (item.price * (item.qty || item.quantity || 1))),
        tax_percent: item.gst_percent || item.tax_percent || 0,
        cgst: item.cgst || 0,
        sgst: item.sgst || 0
      })),
      summary: {
        total: Number(raw.summary?.total || raw.subtotal || raw.total || 0),
        tax: Number(raw.summary?.tax || raw.tax || 0),
        cgst: Number(raw.summary?.cgst || (raw.tax || 0) / 2),
        sgst: Number(raw.summary?.sgst || (raw.tax || 0) / 2),
        grand_total: Number(raw.summary?.grand_total || raw.grand_total || raw.total_amount || 0)
      },
      discount: Number(raw.discount || 0),
      payments: raw.payments || []
    };
  };

  const handleView = async (sale: Sale) => {
    try {
      const rawInvoice = await getInvoice(sale.sale_uuid);
      const normalised = normaliseInvoice(rawInvoice);
      setInvoiceData(normalised);
      setSales(prevSales =>
        prevSales.map(s =>
          s.sale_uuid === sale.sale_uuid
            ? {
              ...s,
              customer: {
                name: normalised.customer.name,
                mobile: normalised.customer.mobile,
              },
            }
            : s
        )
      );
    } catch (e) {
      console.error("Invoice error:", e);
      alert(t('sales.invoiceLoadError'));
    }
  };

  const totalSales = sales.reduce((sum, sale) => {
    const grandTotal = typeof sale.grand_total === 'string' ? parseFloat(sale.grand_total) : (sale.grand_total || 0);
    return sum + grandTotal;
  }, 0);

  const averageSale = sales.length > 0 ? totalSales / sales.length : 0;

  const todaySales = sales.filter(sale => {
    if (!sale.created_at) return false;
    const saleDate = sale.created_at.slice(0, 10);
    const todayDate = new Date().toISOString().slice(0, 10);
    return saleDate === todayDate;
  }).reduce((sum, sale) => {
    const grandTotal = typeof sale.grand_total === 'string'
      ? parseFloat(sale.grand_total)
      : (sale.grand_total || 0);
    return sum + grandTotal;
  }, 0);

  const filteredSales = sales.filter((sale) => {
    const matchesSearch = !searchTerm ||
      sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || sale.created_at?.startsWith(filterDate);
    return matchesSearch && matchesDate;
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

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-start">{t('sales.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('sales.subtitle')}</p>
        </div>
        <Button onClick={loadSales} disabled={loading} variant="outline" className="gap-2">
          <IonIcon icon={refreshOutline} className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          {t('sales.refresh')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Sales"
          value={`₹${formatMoney(totalSales)}`}
          delta="Overall revenue"
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Average Sale"
          value={`₹${formatMoney(averageSale)}`}
          delta="Per transaction"
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          label="Today's Sales"
          value={`₹${formatMoney(todaySales)}`}
          delta="Last 24 hours"
          gradient="bg-gradient-to-br from-violet-500 to-violet-700"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Transactions"
          value={sales.length}
          delta="Total invoices"
          gradient="bg-gradient-to-br from-amber-500 to-amber-700"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IonIcon icon={searchOutline} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <Input
            placeholder={t('sales.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-10 py-2.5 bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
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

        {/* Date filter with Popover – now aligned to end so it doesn't overflow */}
        <div className="relative">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[180px] justify-start text-left font-normal bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {filterDate ? formatDate(new Date(filterDate), "PPP") : <span>Filter by date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none" align="end" sideOffset={5}>
              <Calendar
                mode="single"
                selected={filterDate ? new Date(filterDate) : undefined}
                onSelect={(date) => setFilterDate(date ? formatDate(date, "yyyy-MM-dd") : "")}
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
          {filterDate && (
            <button
              onClick={() => setFilterDate("")}
              className="absolute right-2 top-[55%] -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <IonIcon icon={closeOutline} className="text-lg" />
            </button>
          )}
        </div>
      </div>

      {/* Sales Data Table */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="text-left text-slate-600 min-w-[120px]">Invoice</TableHead>
                <TableHead className="text-left text-slate-600 min-w-[150px]">Customer</TableHead>
                <TableHead className="text-right text-slate-600 min-w-[100px]">Amount</TableHead>
                <TableHead className="text-left text-slate-600 min-w-[160px]">Date &amp; Time</TableHead>
                <TableHead className="text-center text-slate-600 min-w-[90px]">Status</TableHead>
                <TableHead className="text-center text-slate-600 min-w-[90px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                      <p className="text-slate-500 text-sm">{t('sales.loadingSales')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    {searchTerm || filterDate ? t('sales.noSearchResults') : t('sales.noSales')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.sale_uuid} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    {/* Invoice */}
                    <TableCell className="text-left align-top">
                      <div className="font-medium text-slate-800 break-words" title={sale.invoice_number || "N/A"}>
                        {sale.invoice_number || "N/A"}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 break-all">
                        {sale.sale_uuid?.slice(0, 8)}...
                      </div>
                    </TableCell>

                    {/* Customer */}
                    <TableCell className="text-left align-top break-words">
                      {sale.customer_name || t('sales.walkInCustomer')}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-right align-top whitespace-nowrap">
                      <span className="font-bold text-emerald-600 text-lg">
                        ₹{formatMoney(sale.grand_total)}
                      </span>
                    </TableCell>

                    {/* Date & Time */}
                    <TableCell className="text-left align-top">
                      <div className="text-slate-600 whitespace-nowrap">
                        {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : "N/A"}
                      </div>
                      <div className="text-xs text-slate-400 whitespace-nowrap">
                        {sale.created_at ? new Date(sale.created_at).toLocaleTimeString() : ""}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center align-top">
                      <Badge variant="secondary" className="bg-emerald-100 p-1 text-emerald-700 hover:bg-emerald-100 border-emerald-200 whitespace-nowrap">
                        <IonIcon icon={checkmarkCircleOutline} className="text-xs mr-1" />
                        {t('sales.statusCompleted')}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center align-top whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView(sale)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title={t('sales.viewButton')}
                        >
                          <IonIcon icon={eyeOutline} className="text-lg" />
                        </Button>

                        {user?.role === 'owner' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(sale)}
                            disabled={deleting === sale.sale_uuid}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                            title="Delete sale"
                          >
                            {deleting === sale.sale_uuid ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                            ) : (
                              <IonIcon icon={trashOutline} className="text-lg" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Invoice Modal */}
      {invoiceData && (
        <InvoiceReceipt
          invoice={invoiceData}
          onClose={() => setInvoiceData(null)}
          autoPrint={false}
        />
      )}
    </div>
  );
}
