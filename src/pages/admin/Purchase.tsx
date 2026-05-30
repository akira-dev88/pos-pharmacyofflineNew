import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
  businessOutline,
  barcodeOutline,
} from "ionicons/icons";

// shadcn/ui components
import { Button } from "../../../@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../@/components/ui/card";
import { Input } from "../../../@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../@/components/ui/popover";
import { Calendar } from "../../../@/components/ui/calendar";

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

// Reusable calendar classNames for premium dark theme
const calendarClassNames = {
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
};

export default function PurchasePage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [unitsCache, setUnitsCache] = useState<Record<string, ProductUnit[]>>({});
  const [availableUnits, setAvailableUnits] = useState<ProductUnit[]>([]);

  const [supplierId, setSupplierId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
  }, []);

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
      const [p, s, low] = await Promise.all([getProducts(), getSuppliers(), getLowStockProducts(20)]);
      setProducts(Array.isArray(p) ? p : []);
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

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("❌ Purchase error:", err);
      setError(err.message || t('purchase.saveError'));
    } finally {
      setLoading(false);
    }
  };

  // Dashboard stats
  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const lowStockCount = lowStockProducts.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);

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

  const Spinner = ({ size = "sm" }: { size?: "sm" | "lg" }) => (
    <div className={`animate-spin rounded-full border-2 border-slate-200 border-t-blue-500 ${size === "sm" ? "w-4 h-4" : "w-8 h-8"}`} />
  );

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
          value={totalStock}
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
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <IonIcon icon={documentTextOutline} className="text-slate-500 text-xl" />
            Supplier Invoice Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Supplier Select */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Supplier</label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="w-full bg-white border-slate-200 text-slate-800">
                  <SelectValue placeholder="Select a supplier..." />
                </SelectTrigger>
                <SelectContent
                  className="bg-white border-slate-200 mt-1"
                  style={{ width: 'var(--radix-select-trigger-width)' }}
                >
                  {suppliers.length === 0 ? (
                    <SelectItem value="no-supplier" disabled className="text-slate-500 italic">
                      No suppliers found. Add from Supplier page
                    </SelectItem>
                  ) : (
                    suppliers.map((s) => (
                      <SelectItem key={s.supplier_uuid} value={s.supplier_uuid} className="text-slate-700 focus:bg-slate-100">
                        {s.name} {s.phone ? `- ${s.phone}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Invoice Number</label>
              <Input
                placeholder="INV-001"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Invoice Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none">
                  <Calendar
                    mode="single"
                    selected={invoiceDate}
                    onSelect={(date) => date && setInvoiceDate(date)}
                    className="rounded-xl bg-[#141414] p-4 text-white shadow-2xl"
                    classNames={calendarClassNames}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-200"
        >
          <IonIcon icon={addOutline} className="text-xl" />
          Add Item
        </Button>
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

            <div className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Product */}
                  <FormField
                    control={form.control}
                    name="product_uuid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Product *</FormLabel>
                        <Select onValueChange={handleProductSelect} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white border-slate-200 text-slate-800 w-full">
                              <SelectValue placeholder="Select Product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent
                            className="bg-white border-slate-200 mt-1"
                            style={{ width: 'var(--radix-select-trigger-width)' }}
                          >
                            {products.map((p) => (
                              <SelectItem key={p.product_uuid} value={p.product_uuid} className="text-slate-700 focus:bg-slate-100 rounded-md p-2 font-inter">
                                {p.name} (Stock: {p.stock || 0} {p.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

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
                              <SelectTrigger className="bg-white border-slate-200 text-slate-800 disabled:bg-slate-50">
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
                              className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
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
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-slate-700">Expiry Date *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant="outline" className="w-full justify-start text-left font-normal bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto border-0 bg-transparent p-0 shadow-none">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                className="rounded-xl bg-[#141414] p-4 text-white shadow-2xl"
                                classNames={calendarClassNames}
                              />
                            </PopoverContent>
                          </Popover>
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
                              className="bg-white border-slate-200 text-slate-800 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                              className="bg-white border-slate-200 text-slate-800 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                              className="bg-white border-slate-200 text-slate-800 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
    </div>
  );
}