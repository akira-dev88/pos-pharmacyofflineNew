import { useEffect, useState } from "react";
import {
  getSales,
  getInvoice,
  type Invoice,
  type Sale,
} from "../../renderer/services/saleApi";
import { IonIcon } from "@ionic/react";
import {
  eyeOutline,
  printOutline,
  closeOutline,
  cashOutline,
  calendarOutline,
  documentTextOutline,
  trendingUpOutline,
  checkmarkCircleOutline,
  searchOutline,
} from "ionicons/icons";
import InvoiceReceipt from "../pos/components/InvoiceReceipt";

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    loadSales();
  }, []);

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

      // ✅ Normalise each sale to ensure customer object exists
      const normalised = salesData.map((sale: any) => {
        // If sale already has a customer object with a name, keep it
        if (sale.customer?.name) return sale;

        // Otherwise, build a customer object from available fields
        const customerName = sale.customer_name || sale.customerName || sale.customer?.name || "Walk-in Customer";
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

  // Helper to normalise invoice data to the shape expected by InvoiceReceipt
  const normaliseInvoice = (raw: any): any => {
    return {
      // Basic info
      invoice_number: raw.invoice_number,
      sale_uuid: raw.sale_uuid,
      created_at: raw.created_at,
      date: raw.created_at || raw.date,

      // Shop info (fallback if missing)
      shop: raw.shop || {
        name: "My Store",
        address: "Chennai, Tamil Nadu",
        gstin: "33ABCDE1234F1Z5",
        mobile: ""
      },

      // Customer info
      customer: raw.customer || { name: raw.customer_name || "Walk-in Customer" },

      // Items – normalise from different possible sources
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

      // Summary – normalise totals
      summary: {
        total: Number(raw.summary?.total || raw.subtotal || raw.total || 0),
        tax: Number(raw.summary?.tax || raw.tax || 0),
        cgst: Number(raw.summary?.cgst || (raw.tax || 0) / 2),
        sgst: Number(raw.summary?.sgst || (raw.tax || 0) / 2),
        grand_total: Number(raw.summary?.grand_total || raw.grand_total || raw.total_amount || 0)
      },

      discount: Number(raw.discount || 0),

      // Payments
      payments: raw.payments || []
    };
  };

  const handleView = async (sale: Sale) => {
    try {
      const rawInvoice = await getInvoice(sale.sale_uuid);
      const normalised = normaliseInvoice(rawInvoice);
      setInvoiceData(normalised);

      // 🆕 Update this sale in the sales list with the real customer name
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
      alert("Failed to load invoice. Please try again.");
    }
  };

  const format = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // Calculate stats
  const totalSales = sales.reduce((sum, sale) => {
    const grandTotal = typeof sale.grand_total === 'string' ? parseFloat(sale.grand_total) : (sale.grand_total || 0);
    return sum + grandTotal;
  }, 0);

  const averageSale = sales.length > 0 ? totalSales / sales.length : 0;

  const todaySales = sales.filter(sale => {
    if (!sale.created_at) return false;
    // Extract just the date part (YYYY-MM-DD) from the timestamp string
    const saleDate = sale.created_at.slice(0, 10);
    const todayDate = new Date().toISOString().slice(0, 10);
    return saleDate === todayDate;
  }).reduce((sum, sale) => {
    const grandTotal = typeof sale.grand_total === 'string'
      ? parseFloat(sale.grand_total)
      : (sale.grand_total || 0);
    return sum + grandTotal;
  }, 0);

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    const matchesSearch = !searchTerm ||
      sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || sale.created_at?.startsWith(filterDate);
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6 font-inter">
      {/* Header */}
      <div className="flex justify-between items-center font-inter">
        <div className="space-y-1 text-start">
          <h1 className="text-3xl font-bold text-white">Sales</h1>
          <p className="text-gray-300 text-sm mt-1">Manage and view all your sales transactions</p>
        </div>
        <button
          onClick={loadSales}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          <IonIcon icon={documentTextOutline} className="text-xl" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-start">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm">Total Sales</p>
              <p className="text-2xl font-bold mt-1">₹{format(totalSales)}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <IonIcon icon={trendingUpOutline} className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm">Average Sale</p>
              <p className="text-2xl font-bold mt-1">₹{format(averageSale)}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <IonIcon icon={cashOutline} className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 text-sm">Today's Sales</p>
              <p className="text-2xl font-bold mt-1">₹{format(todaySales)}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <IonIcon icon={calendarOutline} className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-100 text-sm">Total Transactions</p>
              <p className="text-2xl font-bold mt-1">{sales.length}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <IonIcon icon={documentTextOutline} className="text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by invoice number or customer name..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <IonIcon icon={searchOutline} className="text-xl" />
          </div>
        </div>

        <input
          type="date"
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto text-start">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Invoice</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-600">Amount</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading sales...</p>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-500">
                    {searchTerm || filterDate ? "No sales match your search" : "No sales found"}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.sale_uuid} className="border-b border-gray-100 hover:bg-gray-50 transition-all group">
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{sale.invoice_number || "N/A"}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">
                        {sale.sale_uuid?.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-700">
                        {sale.customer_name || "Walk-in Customer"}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-green-600 text-lg">
                        ₹{format(sale.grand_total)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-600">
                        {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : "N/A"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {sale.created_at ? new Date(sale.created_at).toLocaleTimeString() : ""}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        <IonIcon icon={checkmarkCircleOutline} className="text-xs" />
                        Completed
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleView(sale)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all inline-flex items-center gap-1"
                        title="View Invoice"
                      >
                        <IonIcon icon={eyeOutline} className="text-lg" />
                        <span className="text-sm">View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVOICE MODAL */}
      {invoiceData && (
        <InvoiceReceipt
          invoice={invoiceData}
          onClose={() => setInvoiceData(null)}
          autoPrint={false}   // set to true if you want auto-print on open
        />
      )}
    </div>
  );
}