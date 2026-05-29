import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPurchase } from "../../renderer/services/purchaseApi";
import { getProducts, getProductUnits, getLowStockProducts } from "../../renderer/services/productApi";
import { getSuppliers } from "../../renderer/services/supplierApi";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
  cartOutline,
  cubeOutline,
  cashOutline,
  closeOutline,
  checkmarkCircleOutline,
  warningOutline,
  documentTextOutline,
  timeOutline,
  calendarOutline,
  businessOutline,
  barcodeOutline,
} from "ionicons/icons";

// ─── UI Components (same as before) ───────────────────────────────────────
const Spinner = ({ size = "sm" }: { size?: "sm" | "lg" }) => (
  <div className={`animate-spin rounded-full border-2 border-slate-200 border-t-blue-500 ${size === "sm" ? "w-4 h-4" : "w-8 h-8"}`} />
);

const StatCard = ({ label, value, delta, gradient, icon }: any) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} group cursor-default`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
        <p className="text-3xl font-bold mt-0.5">{value}</p>
        {delta && <p className="text-xs mt-1.5 opacity-80">{delta}</p>}
      </div>
      <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm">{icon}</div>
    </div>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors" />
  </div>
);

const Input = ({ label, required, icon, ...props }: any) => (
  <div>
    {label && (
      <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <IonIcon icon={icon} className="text-base" />
        </div>
      )}
      <input
        {...props}
        className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all hover:border-slate-300 ${icon ? "pl-9" : ""} ${props.className || ""}`}
      />
    </div>
  </div>
);

const Select = ({ label, options, value, onChange, placeholder, disabled, icon }: any) => (
  <div>
    {label && (
      <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <IonIcon icon={icon} className="text-base" />
        </div>
      )}
      <select
        className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-400 appearance-none ${icon ? "pl-9" : ""}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
);

// ─── Types ────────────────────────────────────────────────────────────────
interface Item {
  product_uuid: string;
  product_name: string;
  unit_uuid: string;
  batch_number: string;
  expiry_date: string;
  manufacture_date: string;
  quantity: number;
  free_quantity: number;
  mrp: number;
  ptr: number;
  cost_price: number;
  gst_percent: number;
  available_units: any[];
}

export default function PurchasePage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [unitsCache, setUnitsCache] = useState<Record<string, any[]>>({});

  const [supplierId, setSupplierId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Single item state (instead of array)
  const [currentItem, setCurrentItem] = useState<Item>({
    product_uuid: "",
    product_name: "",
    unit_uuid: "",
    batch_number: "",
    expiry_date: "",
    manufacture_date: new Date().toISOString().split('T')[0],
    quantity: 1,
    free_quantity: 0,
    mrp: 0,
    ptr: 0,
    cost_price: 0,
    gst_percent: 0,
    available_units: [],
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [p, s, low] = await Promise.all([getProducts(), getSuppliers(), getLowStockProducts(20)]);
      setProducts(Array.isArray(p) ? p : []);
      setSuppliers(Array.isArray(s) ? s : []);
      setLowStockProducts(Array.isArray(low) ? low : []);
    } catch (e) {
      console.error("Load error:", e);
      setError(t('purchase.loadError'));
    }
  };

  const loadProductUnits = async (product_uuid: string) => {
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

  const handleProductChange = async (product_uuid: string) => {
    const product = products.find(p => p.product_uuid === product_uuid);
    if (!product) return;

    const units = await loadProductUnits(product_uuid);
    const baseUnit = units.find((u: any) => u.is_base_unit);

    setCurrentItem(prev => ({
      ...prev,
      product_uuid,
      product_name: product.name || "",
      unit_uuid: baseUnit?.unit_uuid || "",
      available_units: units,
      mrp: product.price || 0,
      cost_price: product.purchase_price || 0,
      gst_percent: product.gst_percent || 0,
    }));
  };

  const updateItemField = (field: keyof Item, value: any) => {
    setCurrentItem(prev => ({ ...prev, [field]: value }));
  };

  const calculateSubtotal = () => {
    const qty = Number(currentItem.quantity) || 0;
    const price = Number(currentItem.cost_price) || 0;
    return qty * price;
  };

  // Dashboard stats
  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const lowStockCount = lowStockProducts.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  const handleSubmit = async () => {
    // Validate fields
    if (!currentItem.product_uuid) {
      setError("Please select a product");
      return;
    }
    if (!currentItem.batch_number?.trim()) {
      setError("Please enter a batch number");
      return;
    }
    if (!currentItem.expiry_date) {
      setError("Please select expiry date");
      return;
    }
    if (!currentItem.unit_uuid) {
      setError("Please select a unit");
      return;
    }
    if (currentItem.quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (currentItem.mrp <= 0) {
      setError("MRP must be greater than 0");
      return;
    }
    if (currentItem.cost_price <= 0) {
      setError("Cost price must be greater than 0");
      return;
    }

    setError(null);
    setLoading(true);

    const payload = {
      supplier_uuid: supplierId || null,
      invoice_number: invoiceNumber.trim() || `INV-${Date.now()}`,
      invoice_date: invoiceDate,
      payment_status: "PENDING",
      items: [
        {
          product_uuid: currentItem.product_uuid,
          unit_uuid: currentItem.unit_uuid,
          batch_number: currentItem.batch_number.trim(),
          expiry_date: currentItem.expiry_date,
          manufacture_date: currentItem.manufacture_date || new Date().toISOString().split('T')[0],
          quantity: Number(currentItem.quantity),
          free_quantity: Number(currentItem.free_quantity) || 0,
          mrp: Number(currentItem.mrp),
          ptr: Number(currentItem.ptr) || Number(currentItem.cost_price) * 1.1,
          rate: Number(currentItem.cost_price),
          cost_price: Number(currentItem.cost_price),
          purchase_price: Number(currentItem.cost_price),
          selling_price: Number(currentItem.mrp),
          gst_percent: Number(currentItem.gst_percent) || 0,
        },
      ],
    };

    try {
      const result = await createPurchase(payload);
      console.log("✅ Purchase result:", result);
      setSuccess("Purchase completed successfully! Stock has been added.");

      // Reset form
      setModalOpen(false);
      setSupplierId("");
      setInvoiceNumber("");
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setCurrentItem({
        product_uuid: "",
        product_name: "",
        unit_uuid: "",
        batch_number: "",
        expiry_date: "",
        manufacture_date: new Date().toISOString().split('T')[0],
        quantity: 1,
        free_quantity: 0,
        mrp: 0,
        ptr: 0,
        cost_price: 0,
        gst_percent: 0,
        available_units: [],
      });
      await loadData();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("❌ Purchase error:", err);
      setError(err.message || t('purchase.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('purchase.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('purchase.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-md">
            <IonIcon icon={cartOutline} className="text-xl" />
            <span className="text-sm font-semibold">{t('purchase.purchaseLabel')}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Products"
          value={totalProducts}
          delta="In master database"
          gradient="bg-gradient-to-br from-blue-500 to-blue-700 text-white"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          label="Total Stock"
          value={totalStock}
          delta="Units across batches"
          gradient="bg-gradient-to-br from-violet-500 to-violet-700 text-white"
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
          gradient="bg-gradient-to-br from-amber-400 to-amber-600 text-white"
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
          gradient="bg-gradient-to-br from-red-400 to-rose-600 text-white"
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
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

      {/* Supplier & Invoice Details */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <IonIcon icon={documentTextOutline} className="text-slate-600 text-xl" />
            <h2 className="text-black font-semibold text-lg">Supplier Invoice Details</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Select
              label="Supplier"
              icon={businessOutline}
              options={suppliers.map(s => ({ value: s.supplier_uuid, label: `${s.name} ${s.phone ? `- ${s.phone}` : ''}` }))}
              value={supplierId}
              onChange={(e: any) => setSupplierId(e.target.value)}
              placeholder="Select a supplier..."
            />
            <Input
              label="Invoice Number"
              icon={barcodeOutline}
              type="text"
              placeholder="INV-001"
              value={invoiceNumber}
              onChange={(e: any) => setInvoiceNumber(e.target.value)}
            />
            <Input
              label="Invoice Date"
              icon={calendarOutline}
              type="date"
              value={invoiceDate}
              onChange={(e: any) => setInvoiceDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Add Item Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-200"
        >
          <IonIcon icon={addOutline} className="text-xl" />
          Add Item
        </button>
      </div>

      {/* Modal for Item Entry */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Add Purchase Item</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <IonIcon icon={closeOutline} className="text-2xl" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Product */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
                  Product <span className="text-red-400">*</span>
                </label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  value={currentItem.product_uuid}
                  onChange={(e) => handleProductChange(e.target.value)}
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.product_uuid} value={p.product_uuid}>
                      {p.name} (Stock: {p.stock || 0} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit, Batch, Expiry Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Unit</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                    value={currentItem.unit_uuid}
                    onChange={(e) => updateItemField("unit_uuid", e.target.value)}
                    disabled={!currentItem.product_uuid}
                  >
                    <option value="">Select Unit</option>
                    {currentItem.available_units.map(unit => (
                      <option key={unit.unit_uuid} value={unit.unit_uuid}>
                        {unit.unit_name} {unit.is_base_unit ? "(Base)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Batch #</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                    placeholder="Batch number"
                    value={currentItem.batch_number}
                    onChange={(e) => updateItemField("batch_number", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Expiry Date</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                    value={currentItem.expiry_date}
                    onChange={(e) => updateItemField("expiry_date", e.target.value)}
                  />
                </div>
              </div>

              {/* Quantity, MRP, Cost Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                    value={currentItem.quantity}
                    onChange={(e) => updateItemField("quantity", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                    value={currentItem.mrp}
                    onChange={(e) => updateItemField("mrp", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                    value={currentItem.cost_price}
                    onChange={(e) => updateItemField("cost_price", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Subtotal */}
              <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Subtotal</span>
                <span className="text-2xl font-bold text-emerald-600">₹{calculateSubtotal().toFixed(2)}</span>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-xl font-bold text-base transition-all disabled:opacity-50 shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
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
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mt-2">
        <IonIcon icon={timeOutline} className="text-sm" />
        <span>Stock will be added to batches automatically.</span>
      </div>
    </div>
  );
}