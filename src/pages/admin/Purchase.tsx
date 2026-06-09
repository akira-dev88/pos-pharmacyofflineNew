import { useEffect, useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import SimpleDatePicker from "../../components/SimpleDatePicker";
import { createPurchase, getPurchases } from "../../renderer/services/purchaseApi";
import { getProducts, getProductUnits, getLowStockProducts } from "../../renderer/services/productApi";
import { getSuppliers } from "../../renderer/services/supplierApi";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
  cubeOutline,
  cashOutline,
  closeOutline,
  checkmarkCircleOutline,
  warningOutline,
  documentTextOutline,
  timeOutline,
  businessOutline,
  barcodeOutline,
} from "ionicons/icons";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// ─── Types ────────────────────────────────────────────────────────────────
interface ProductUnit {
  unit_uuid: string;
  unit_name: string;
  is_base_unit: boolean;
  conversion_factor: number;
}

interface ItemFormValues {
  product_uuid: string;
  unit_uuid: string;
  batch_number: string;
  expiry_date: Date;
  quantity: number;
  mrp: number;
  cost_price: number;
}

// Zod validation schema
const itemSchema = z.object({
  product_uuid: z.string().min(1, "Product is required"),
  unit_uuid: z.string().min(1, "Unit is required"),
  batch_number: z.string().min(1, "Batch number is required"),
  expiry_date: z.date().refine(val => val !== undefined, "Expiry date is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  mrp: z.number().min(0.01, "MRP must be greater than 0"),
  cost_price: z.number().min(0.01, "Cost price must be greater than 0"),
});

export default function PurchasePage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [unitsCache, setUnitsCache] = useState<Record<string, ProductUnit[]>>({});
  const [availableUnits, setAvailableUnits] = useState<ProductUnit[]>([]);

  const [supplierId, setSupplierId] = useState<string>("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());

  const [modalOpen, setModalOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expiryShowPicker, setExpiryShowPicker] = useState(false);
  const [invPickPos, setInvPickPos] = useState({ top: 0, right: 0 });
  const [expiryPickPos, setExpiryPickPos] = useState({ top: 0, right: 0 });
  const invBtnRef = useRef<HTMLButtonElement>(null);
  const expiryBtnRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [pageR, setPageR] = useState(1);
  const pageSize = 5;

  // Form setup
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      product_uuid: "",
      unit_uuid: "",
      batch_number: "",
      expiry_date: undefined,
      quantity: 1,
      mrp: 0,
      cost_price: 0,
    },
  });

  const watchProduct = form.watch("product_uuid");
  const watchQuantity = form.watch("quantity");
  const watchCostPrice = form.watch("cost_price");
  const subtotal = (watchQuantity || 0) * (watchCostPrice || 0);

  useEffect(() => {
    loadData();
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setPurchasesLoading(true);
    try {
      const data = await getPurchases();
      setPurchases(Array.isArray(data) ? data : []);
    } catch {
      setPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  };

  const filteredPurchases = purchaseSearch
    ? purchases.filter((p: any) =>
        (p.supplier?.name || "").toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        (p.invoice_number || "").toLowerCase().includes(purchaseSearch.toLowerCase())
      )
    : purchases;
  const totalPages = Math.ceil(filteredPurchases.length / pageSize);
  const paginatedPurchases = filteredPurchases.slice((pageR - 1) * pageSize, pageR * pageSize);

  // Click outside handlers for date pickers
  useEffect(() => {
    if (!showDatePicker || !invBtnRef.current) return;
    const rect = invBtnRef.current.getBoundingClientRect();
    setInvPickPos({ top: rect.bottom + 4, right: document.documentElement.clientWidth - rect.right });
    const handler = (e: MouseEvent) => {
      if (invBtnRef.current && !invBtnRef.current.contains(e.target as Node)) {
        const cal = document.getElementById("inv-cal-popup");
        if (cal && !cal.contains(e.target as Node)) {
          setShowDatePicker(false);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDatePicker]);

  useEffect(() => {
    if (!expiryShowPicker || !expiryBtnRef.current) return;
    const rect = expiryBtnRef.current.getBoundingClientRect();
    setExpiryPickPos({ top: rect.bottom + 4, right: document.documentElement.clientWidth - rect.right });
    const handler = (e: MouseEvent) => {
      if (expiryBtnRef.current && !expiryBtnRef.current.contains(e.target as Node)) {
        const cal = document.getElementById("expiry-cal-popup");
        if (cal && !cal.contains(e.target as Node)) {
          setExpiryShowPicker(false);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expiryShowPicker]);

  useEffect(() => {
    if (watchProduct) {
      loadProductUnits(watchProduct).then((units) => {
        setAvailableUnits(units);
        const baseUnit = units.find((u) => u.is_base_unit);
        if (baseUnit) {
          form.setValue("unit_uuid", baseUnit.unit_uuid);
        } else if (units.length > 0) {
          form.setValue("unit_uuid", units[0].unit_uuid);
        }
      });
    } else {
      setAvailableUnits([]);
      form.setValue("unit_uuid", "");
    }
  }, [watchProduct]);

  const loadData = async () => {
    try {
      setError(null);
      const [p, s, low] = await Promise.all([getProducts(1, 5000), getSuppliers(), getLowStockProducts(20)]);
      setProducts(p.products);
      setSuppliers(Array.isArray(s) ? s : []);
      setLowStockProducts(Array.isArray(low) ? low : []);
    } catch (e) {
      console.error("Load error:", e);
      setError(t('purchase.loadError'));
    }
  };

  const loadProductUnits = async (product_uuid: string): Promise<ProductUnit[]> => {
    if (unitsCache[product_uuid]) return unitsCache[product_uuid];
    try {
      const units = await getProductUnits(product_uuid);
      setUnitsCache(prev => ({ ...prev, [product_uuid]: units }));
      return units;
    } catch (err) {
      console.error("Failed to load units:", err);
      return [];
    }
  };

  const handleProductSelect = (product_uuid: string) => {
    const product = products.find(p => p.product_uuid === product_uuid);
    if (product) {
      form.setValue("product_uuid", product_uuid);
      form.setValue("mrp", product.price || 0);
      form.setValue("cost_price", product.purchase_price || 0);
    }
  };

  const onSubmit = async (data: ItemFormValues) => {
    setError(null);
    setLoading(true);

    const payload = {
      supplier_uuid: supplierId || null,
      invoice_number: invoiceNumber.trim() || `INV-${Date.now()}`,
      invoice_date: format(invoiceDate, "yyyy-MM-dd"),
      payment_status: "PENDING",
      items: [
        {
          product_uuid: data.product_uuid,
          unit_uuid: data.unit_uuid,
          batch_number: data.batch_number.trim(),
          expiry_date: format(data.expiry_date, "yyyy-MM-dd"),
          manufacture_date: format(new Date(), "yyyy-MM-dd"),
          quantity: data.quantity,
          free_quantity: 0,
          mrp: data.mrp,
          ptr: data.cost_price * 1.1,
          rate: data.cost_price,
          cost_price: data.cost_price,
          purchase_price: data.cost_price,
          selling_price: data.mrp,
          gst_percent: products.find(p => p.product_uuid === data.product_uuid)?.gst_percent || 0,
        },
      ],
    };

    try {
      const result = await createPurchase(payload);
      console.log("✅ Purchase result:", result);
      setSuccess("Purchase completed successfully! Stock has been added.");

      setModalOpen(false);
      setSupplierId("");
      setInvoiceNumber("");
      setInvoiceDate(new Date());
      form.reset();
      await loadData();
      await loadPurchases();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("❌ Purchase error:", err);
      setError(err.message || t('purchase.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const formatCompactNumber = (num: number): string => {
    if (num === null || num === undefined) return "0";
    const absNum = Math.abs(num);
    if (absNum >= 10000000) return (num / 10000000).toFixed(2) + "cr";
    if (absNum >= 100000) return (num / 100000).toFixed(2) + "L";
    if (absNum >= 1000) return (num / 1000).toFixed(2) + "k";
    return num.toString();
  };

  // Supplier usage stats
  const supplierUsage = purchases.reduce((acc: Record<string, number>, p: any) => {
    const uuid = p.supplier?.supplier_uuid || p.supplier_uuid;
    if (uuid) acc[uuid] = (acc[uuid] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSuppliers = [...suppliers]
    .sort((a, b) => (supplierUsage[b.supplier_uuid] || 0) - (supplierUsage[a.supplier_uuid] || 0))
    .slice(0, 10);

  const filteredSuppliers = supplierSearch
    ? suppliers.filter((s) =>
        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        (s.phone || "").includes(supplierSearch)
      )
    : topSuppliers;

  // Product usage stats
  const productUsage = purchases.reduce((acc: Record<string, number>, p: any) => {
    if (p.items) {
      p.items.forEach((item: any) => {
        const uuid = item.product_uuid;
        if (uuid) acc[uuid] = (acc[uuid] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const topProducts = [...products]
    .sort((a, b) => (productUsage[b.product_uuid] || 0) - (productUsage[a.product_uuid] || 0))
    .slice(0, 10);

  const filteredProducts = productSearch
    ? products.filter((p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
      )
    : topProducts;

  // Dashboard stats
  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const lowStockCount = lowStockProducts.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  const trendData = useMemo(() => {
    const gen = (peak: number) => {
      const pts: number[] = [];
      for (let i = 0; i < 20; i++) {
        const base = (i / 19) * peak;
        pts.push(Math.max(0, Math.round(base * (0.7 + ((i * 7 + 13) % 10) / 20))));
      }
      return pts;
    };
    return {
      products: gen(totalProducts),
      stock: gen(totalStock),
      low: gen(lowStockCount),
      out: gen(outOfStockCount),
    };
  }, [totalProducts, totalStock, lowStockCount, outOfStockCount]);

  const Sparkline = ({ data: chartData, width = 320, height = 100, color = "#22c55e" }: { data: number[], width?: number, height?: number, color?: string }) => {
    const [hovered, setHovered] = useState(false);
    if (!chartData || chartData.length < 2) return null;
    const values = chartData;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const points = values.map((v: number, i: number) => ({
      x: i / (values.length - 1) * width,
      y: 4 + (height - 8) * (1 - (v - min) / range),
    }));
    const smoothPath = (pts: { x: number; y: number }[]) => {
      if (pts.length < 2) return '';
      let d = `M ${pts[0].x},${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1], p1 = pts[i], p_1 = pts[Math.max(0, i - 2)], p2 = pts[Math.min(pts.length - 1, i + 1)];
        d += ` C ${p0.x + (p1.x - p_1.x) / 6},${p0.y + (p1.y - p_1.y) / 6} ${p1.x - (p2.x - p0.x) / 6},${p1.y - (p2.y - p0.y) / 6} ${p1.x},${p1.y}`;
      }
      return d;
    };
    const lineD = smoothPath(points);
    const areaD = `${lineD} L ${width},${height} L 0,${height} Z`;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={hovered ? 0.55 : 0.38} />
            <stop offset="100%" stopColor={color} stopOpacity={hovered ? 0.06 : 0.02} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#sg-${color.replace('#','')})`} />
        <path d={lineD} fill="none" stroke={color} strokeWidth={hovered ? 3.5 : 2.5} strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke-width 0.15s' }} />
      </svg>
    );
  };

  const Spinner = ({ size = "sm" }: { size?: "sm" | "lg" }) => (
    <div className={`animate-spin rounded-full border-2 border-slate-200 border-t-blue-500 ${size === "sm" ? "w-4 h-4" : "w-8 h-8"}`} />
  );



  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 text-start">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-6 relative">
          <button onClick={() => setSelectedStat('products')} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </button>
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">Statistics</p>
            <p className="text-sm font-semibold text-gray-700 mb-3">Total Products</p>
            <p className="text-5xl font-bold text-gray-900 leading-none">{formatCompactNumber(totalProducts)}</p>
            <p className="text-xs text-gray-500 mt-1">In master database</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-6 relative">
          <button onClick={() => setSelectedStat('stock')} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </button>
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">Statistics</p>
            <p className="text-sm font-semibold text-gray-700 mb-3">Total Stock</p>
            <p className="text-5xl font-bold text-gray-900 leading-none">{formatCompactNumber(totalStock)}</p>
            <p className="text-xs text-gray-500 mt-1">Units across batches</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-6 relative">
          <button onClick={() => setSelectedStat('low')} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </button>
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">Statistics</p>
            <p className="text-sm font-semibold text-gray-700 mb-3">Low Stock</p>
            <p className="text-5xl font-bold text-gray-900 leading-none">{formatCompactNumber(lowStockCount)}</p>
            <p className="text-xs text-gray-500 mt-1">Below threshold</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-6 relative">
          <button onClick={() => setSelectedStat('out')} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </button>
          <div className="flex-shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">Statistics</p>
            <p className="text-sm font-semibold text-gray-700 mb-3">Out of Stock</p>
            <p className="text-5xl font-bold text-gray-900 leading-none">{formatCompactNumber(outOfStockCount)}</p>
            <p className="text-xs text-gray-500 mt-1">Needs restock</p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      <div className="space-y-2">
        {success && (
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>



      {/* Recent Purchases */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-xl font-bold text-slate-800 shrink-0">Recent Purchases</h3>
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search purchases..."
              value={purchaseSearch}
              onChange={(e) => { setPurchaseSearch(e.target.value); setPageR(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 placeholder:text-slate-400"
            />
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm shrink-0"
          >
            <IonIcon icon={addOutline} className="text-lg" />
            Add Item
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {purchasesLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
              Loading...
            </div>
          ) : paginatedPurchases.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">No purchases yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500">Supplier</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500">Date</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500">Time</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500">Items</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPurchases.map((p: any) => (
                  <tr key={p.purchase_uuid} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-center font-medium text-gray-800">{p.supplier?.name || 'Unknown Supplier'}</td>
                    <td className="px-5 py-3.5 text-center text-gray-500">{format(new Date(p.created_at), 'dd MMM yyyy')}</td>
                    <td className="px-5 py-3.5 text-center text-gray-500">{format(new Date(p.created_at), 'h:mm a')}</td>
                    <td className="px-5 py-3.5 text-center text-gray-500">{p.items ? p.items.length : 0}</td>
                    <td className="px-5 py-3.5 text-center font-semibold text-emerald-600">₹{Number(p.total || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Showing {(pageR - 1) * pageSize + 1}–{Math.min(pageR * pageSize, filteredPurchases.length)} of {filteredPurchases.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPageR(p => Math.max(1, p - 1))}
                  disabled={pageR === 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                {(() => {
                  const pages: (number | string)[] = [];
                  const range = 2;
                  for (let i = 1; i <= totalPages; i++) {
                    if (i === 1 || i === totalPages || (i >= pageR - range && i <= pageR + range)) {
                      pages.push(i);
                    } else if (pages[pages.length - 1] !== '...') {
                      pages.push('...');
                    }
                  }
                  return pages.map((p, idx) =>
                    p === '...' ? (
                      <span key={`e-${idx}`} className="px-1 text-xs text-slate-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPageR(p as number)}
                        className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                          p === pageR
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}
                <button
                  onClick={() => setPageR(p => Math.min(totalPages, p + 1))}
                  disabled={pageR === totalPages}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Item Entry */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Add Purchase Item</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <IonIcon icon={closeOutline} className="text-2xl" />
              </button>
            </div>

            <div className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Supplier & Invoice Details */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <IonIcon icon={documentTextOutline} className="text-slate-500 text-base" />
                      Supplier Invoice Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Supplier Select */}
                      <div className="relative md:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Supplier</label>
                        <button
                          type="button"
                          onClick={() => setSupplierDropdownOpen(!supplierDropdownOpen)}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-800 hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                        >
                          <span className={supplierId ? "text-slate-800" : "text-slate-400"}>
                            {supplierId
                              ? suppliers.find((s) => s.supplier_uuid === supplierId)?.name || "Select a supplier..."
                              : "Select a supplier..."}
                          </span>
                          <svg className={`w-4 h-4 text-slate-400 transition-transform ${supplierDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {supplierDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => { setSupplierDropdownOpen(false); setSupplierSearch(""); }} />
                            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden" style={{ position: 'absolute' }}>
                              <div className="p-2 border-b border-slate-100">
                                <input
                                  type="text"
                                  placeholder="Search suppliers..."
                                  value={supplierSearch}
                                  onChange={(e) => setSupplierSearch(e.target.value)}
                                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 placeholder:text-slate-400"
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {filteredSuppliers.length === 0 ? (
                                  <div className="px-4 py-6 text-center text-sm text-slate-400">No suppliers found</div>
                                ) : (
                                  filteredSuppliers.map((s) => (
                                    <button
                                      key={s.supplier_uuid}
                                      type="button"
                                      onClick={() => {
                                        setSupplierId(s.supplier_uuid);
                                        setSupplierDropdownOpen(false);
                                        setSupplierSearch("");
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${
                                        supplierId === s.supplier_uuid ? "bg-green-50 text-green-700 font-medium" : "text-slate-700"
                                      }`}
                                    >
                                      <span>{s.name}</span>
                                      {s.phone && <span className="text-xs text-slate-400">+91 {s.phone}</span>}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Invoice Number */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Invoice Number</label>
                        <Input
                          placeholder="INV-001"
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          className="w-full bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-green-500/20 focus-visible:border-green-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product + Invoice Date */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="product_uuid"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">Product *</FormLabel>
                            <FormControl>
                              <div className="relative">
                            <button
                              type="button"
                              onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-800 hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                            >
                              <span className={field.value ? "text-slate-800" : "text-slate-400"}>
                                {field.value
                                  ? (products.find((p) => p.product_uuid === field.value)?.name || "Select a product...")
                                  : "Select a product..."}
                              </span>
                              <svg className={`w-4 h-4 text-slate-400 transition-transform ${productDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {productDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => { setProductDropdownOpen(false); setProductSearch(""); }} />
                                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                                  <div className="p-2 border-b border-slate-100">
                                    <input
                                      type="text"
                                      placeholder="Search products..."
                                      value={productSearch}
                                      onChange={(e) => setProductSearch(e.target.value)}
                                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 placeholder:text-slate-400"
                                      autoFocus
                                    />
                                  </div>
                                  <div className="max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    {filteredProducts.length === 0 ? (
                                      <div className="px-4 py-6 text-center text-sm text-slate-400">No products found</div>
                                    ) : (
                                      filteredProducts.map((p) => (
                                        <button
                                          key={p.product_uuid}
                                          type="button"
                                          onClick={() => {
                                            handleProductSelect(p.product_uuid);
                                            setProductDropdownOpen(false);
                                            setProductSearch("");
                                          }}
                                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${
                                            field.value === p.product_uuid ? "bg-green-50 text-green-700 font-medium" : "text-slate-700"
                                          }`}
                                        >
                                          <span>{p.name}</span>
                                          <span className="text-xs text-slate-400">Stock: {p.stock || 0} {p.unit}</span>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                    </div>

                    {/* Invoice Date */}
                    <div className="relative mt-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Invoice Date</label>
                      <button
                        ref={invBtnRef}
                        type="button"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-700 hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                      >
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                        <span>{invoiceDate ? format(invoiceDate, "dd MMM yyyy") : "Pick a date"}</span>
                      </button>
                      {showDatePicker && (
                        <div id="inv-cal-popup" className="fixed z-[70]" style={{ top: invPickPos.top, right: invPickPos.right }}>
                          <SimpleDatePicker date={invoiceDate} onSelect={(d) => { setInvoiceDate(d); setShowDatePicker(false); }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unit, Batch, Expiry row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="unit_uuid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Unit *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!watchProduct}>
                            <FormControl>
                              <SelectTrigger className="bg-white border-slate-200 text-slate-800 disabled:bg-slate-50 focus:ring-2 focus:ring-green-500/20 focus:border-green-400">
                                <SelectValue placeholder="Select Unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border-slate-200 w-full">
                              {availableUnits.map((unit) => (
                                <SelectItem key={unit.unit_uuid} value={unit.unit_uuid} className="text-slate-700 focus:bg-slate-100">
                                  {unit.unit_name} {unit.is_base_unit ? "(Base)" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="batch_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Batch # *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Batch number"
                              {...field}
                              className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:ring-green-500/20 focus-visible:border-green-400"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Expiry Date *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <button
                                ref={expiryBtnRef}
                                type="button"
                                onClick={() => setExpiryShowPicker(!expiryShowPicker)}
                                className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-700 hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                              >
                                <CalendarIcon className="w-4 h-4 text-slate-400" />
                                <span>{field.value ? format(field.value, "dd MMM yyyy") : "Pick a date"}</span>
                              </button>
                              {expiryShowPicker && (
                                <div id="expiry-cal-popup" className="fixed z-[70]" style={{ top: expiryPickPos.top, right: expiryPickPos.right }}>
                                  <SimpleDatePicker date={field.value} onSelect={(d) => { field.onChange(d); setExpiryShowPicker(false); }} disableFuture={false} />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Quantity, MRP, Cost Price row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Quantity *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              value={field.value === 0 ? '' : field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                  field.onChange(0);
                                } else {
                                  const num = parseInt(val, 10);
                                  field.onChange(isNaN(num) ? 0 : num);
                                }
                              }}
                              className="bg-white border-slate-200 text-slate-800 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus-visible:ring-green-500/20 focus-visible:border-green-400"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mrp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">MRP (₹) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              value={field.value === 0 ? '' : field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                  field.onChange(0);
                                } else {
                                  const num = parseFloat(val);
                                  field.onChange(isNaN(num) ? 0 : num);
                                }
                              }}
                              className="bg-white border-slate-200 text-slate-800 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus-visible:ring-green-500/20 focus-visible:border-green-400"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cost_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Cost Price (₹) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              value={field.value === 0 ? '' : field.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                  field.onChange(0);
                                } else {
                                  const num = parseFloat(val);
                                  field.onChange(isNaN(num) ? 0 : num);
                                }
                              }}
                              className="bg-white border-slate-200 text-slate-800 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus-visible:ring-green-500/20 focus-visible:border-green-400"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center border border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Subtotal</span>
                    <span className="text-2xl font-bold text-emerald-600">₹{subtotal.toFixed(2)}</span>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-xl font-bold text-base"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <IonIcon icon={checkmarkCircleOutline} className="text-xl" />
                        <span>Add Stock / Create Purchase</span>
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mt-2">
        <IonIcon icon={timeOutline} className="text-sm" />
        <span>Stock will be added to batches automatically.</span>
      </div>

      {selectedStat && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStat(null)}>
          <div className="w-[400px] h-[500px] rounded-[24px] overflow-hidden pt-5 px-5 pb-3 flex flex-col" style={{ background: "#1a1d1f" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-1">
              <button onClick={() => setSelectedStat(null)} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "#dc2626", color: "#fff" }}>
                Close
              </button>
            </div>

            {selectedStat === 'products' && (
              <>
                <div className="flex-1 flex flex-col justify-center text-center px-4">
                  <p className="text-base" style={{ color: "#888888" }}>Total Products</p>
                  <p className="text-5xl font-bold leading-none tracking-tight text-white mt-3">{totalProducts.toLocaleString()}</p>
                  <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mt-3 mx-auto" style={{ background: "#3b82f6", color: "#fff" }}>
                    Master Database
                  </span>
                </div>
                <div className="relative -mx-5 -mb-3" style={{ height: 180 }}>
                  <Sparkline data={trendData.products} width={400} height={180} color="#3b82f6" />
                </div>
              </>
            )}

            {selectedStat === 'stock' && (
              <>
                <div className="flex-1 flex flex-col justify-center text-center px-4">
                  <p className="text-base" style={{ color: "#888888" }}>Total Stock</p>
                  <p className="text-5xl font-bold leading-none tracking-tight text-white mt-3">{totalStock.toLocaleString()}</p>
                  <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mt-3 mx-auto" style={{ background: "#8b5cf6", color: "#fff" }}>
                    Units Across Batches
                  </span>
                </div>
                <div className="relative -mx-5 -mb-3" style={{ height: 180 }}>
                  <Sparkline data={trendData.stock} width={400} height={180} color="#8b5cf6" />
                </div>
              </>
            )}

            {selectedStat === 'low' && (
              <>
                <div className="flex-1 flex flex-col justify-center text-center px-4">
                  <p className="text-base" style={{ color: "#888888" }}>Low Stock</p>
                  <p className="text-5xl font-bold leading-none tracking-tight text-white mt-3">{lowStockCount.toLocaleString()}</p>
                  <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mt-3 mx-auto" style={{ background: "#f59e0b", color: "#fff" }}>
                    Below Threshold
                  </span>
                </div>
                <div className="relative -mx-5 -mb-3" style={{ height: 180 }}>
                  <Sparkline data={trendData.low} width={400} height={180} color="#f59e0b" />
                </div>
              </>
            )}

            {selectedStat === 'out' && (
              <>
                <div className="flex-1 flex flex-col justify-center text-center px-4">
                  <p className="text-base" style={{ color: "#888888" }}>Out of Stock</p>
                  <p className="text-5xl font-bold leading-none tracking-tight text-white mt-3">{outOfStockCount.toLocaleString()}</p>
                  <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mt-3 mx-auto" style={{ background: "#ef4444", color: "#fff" }}>
                    Needs Restock
                  </span>
                </div>
                <div className="relative -mx-5 -mb-3" style={{ height: 180 }}>
                  <Sparkline data={trendData.out} width={400} height={180} color="#ef4444" />
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}


