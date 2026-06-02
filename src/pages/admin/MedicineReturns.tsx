import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getMedicineReturns, createMedicineReturn } from "../../renderer/services/medicineReturnApi";
import { IonIcon } from "@ionic/react";
import {
  refreshOutline,
  addOutline,
  closeOutline,
  checkmarkCircleOutline,
  warningOutline,
  returnUpBackOutline,
  searchOutline,
} from "ionicons/icons";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MedicineReturns() {
  const { t } = useTranslation();
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    sale_uuid: "",
    product_uuid: "",
    batch_uuid: "",
    return_type: "customer_return",
    quantity: 0,
    refund_amount: 0,
    reason: "",
  });

  const loadReturns = async () => {
    setLoading(true);
    try {
      const data = await getMedicineReturns();
      setReturns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load medicine returns:", err);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const filtered = returns.filter((r) =>
    [r.return_type, r.reason, r.product_name, r.sale_uuid]
      .some((f) => f?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async () => {
    if (!form.product_uuid || !form.batch_uuid || !form.quantity) {
      setError("Product, batch, and quantity are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createMedicineReturn(form as any);
      setModalOpen(false);
      setForm({
        sale_uuid: "", product_uuid: "", batch_uuid: "",
        return_type: "customer_return", quantity: 0, refund_amount: 0, reason: "",
      });
      await loadReturns();
    } catch (err: any) {
      setError(err.message || "Failed to create return");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medicine Returns</h1>
          <p className="text-slate-500 text-sm mt-0.5">Customer and supplier returns</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadReturns} className="bg-white border-slate-200">
            <IonIcon icon={refreshOutline} className="text-slate-600 text-xl" />
          </Button>
          <Button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <IonIcon icon={addOutline} className="text-lg" />
            New Return
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <IonIcon icon={searchOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search returns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-slate-400 py-12">No medicine returns found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Refund</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r: any) => (
                    <TableRow key={r.return_uuid || r.id}>
                      <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.return_type === "customer_return" ? "warning" : "info"}>
                          {r.return_type === "customer_return" ? "Customer" : "Supplier"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">{r.product_name || r.product_uuid}</TableCell>
                      <TableCell className="text-right font-semibold">{r.quantity}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">₹{fmt(r.refund_amount)}</TableCell>
                      <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{r.reason || "-"}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{r.performed_by_name || r.performed_by?.slice(0, 8) || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171717] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-[#171717] border-b border-gray-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">New Medicine Return</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-200 transition-colors">
                <IonIcon icon={closeOutline} className="text-2xl" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-900/50 border border-red-700 rounded-xl flex items-center gap-2 text-red-200 text-sm">
                  <IonIcon icon={warningOutline} className="text-lg flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">Return Type</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setForm({ ...form, return_type: "customer_return" })}
                    className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.return_type === "customer_return"
                        ? "border-amber-500 bg-amber-900/30 text-amber-300"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    Customer Return
                  </button>
                  <button
                    onClick={() => setForm({ ...form, return_type: "supplier_return" })}
                    className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.return_type === "supplier_return"
                        ? "border-blue-500 bg-blue-900/30 text-blue-300"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    Supplier Return
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">Sale UUID</label>
                <Input
                  placeholder="sale_uuid (optional)"
                  value={form.sale_uuid}
                  onChange={(e) => setForm({ ...form, sale_uuid: e.target.value })}
                  className="h-10 w-full rounded-lg border border-gray-600 bg-gray-800 px-2.5 py-1 text-base text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">Product UUID *</label>
                <Input
                  placeholder="product_uuid"
                  value={form.product_uuid}
                  onChange={(e) => setForm({ ...form, product_uuid: e.target.value })}
                  className="h-10 w-full rounded-lg border border-gray-600 bg-gray-800 px-2.5 py-1 text-base text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">Batch UUID *</label>
                <Input
                  placeholder="batch_uuid"
                  value={form.batch_uuid}
                  onChange={(e) => setForm({ ...form, batch_uuid: e.target.value })}
                  className="h-10 w-full rounded-lg border border-gray-600 bg-gray-800 px-2.5 py-1 text-base text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">Quantity *</label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="0"
                    value={form.quantity || ""}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="h-10 w-full rounded-lg border border-gray-600 bg-gray-800 px-2.5 py-1 text-base text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">Refund Amount</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={form.refund_amount || ""}
                    onChange={(e) => setForm({ ...form, refund_amount: Number(e.target.value) })}
                    className="h-10 w-full rounded-lg border border-gray-600 bg-gray-800 px-2.5 py-1 text-base text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">Reason</label>
                <Input
                  placeholder="Why is this being returned?"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="h-10 w-full rounded-lg border border-gray-600 bg-gray-800 px-2.5 py-1 text-base text-white"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#171717] border-t border-gray-700 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <IonIcon icon={returnUpBackOutline} className="text-lg" />
                    Record Return
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
