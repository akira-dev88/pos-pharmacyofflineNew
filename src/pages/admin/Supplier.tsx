import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type Supplier,
} from "../../renderer/services/supplierApi";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
  createOutline,
  trashOutline,
  searchOutline,
  closeOutline,
  peopleOutline,
  callOutline,
  mailOutline,
  locationOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";

// shadcn/ui components (only those that work)
import { Card, CardContent } from "../../../@/components/ui/card";
import { Button } from "../../../@/components/ui/button";
import { Input } from "../../../@/components/ui/input";
import { Textarea } from "../../../@/components/ui/textarea";
import { Badge } from "../../../@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../@/components/ui/table";

// ── Reusable StatCard
const StatCard = ({ label, value, gradient, icon }: any) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} group cursor-default text-white min-w-0`}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1 truncate">
          {label}
        </p>
        <p className="text-2xl sm:text-3xl font-bold mt-0.5 truncate">{value}</p>
      </div>
      <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors" />
  </div>
);

export default function SupplierPage() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Add supplier form
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Edit supplier
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Supplier>>({});

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSuppliers();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Supplier load error:", e);
      setError(t('suppliers.loadError'));
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError(t('suppliers.nameRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supplierData = {
        name: form.name.trim(),
        phone: form.phone?.trim() || "",
        email: form.email?.trim() || "",
        address: form.address?.trim() || "",
      };

      await createSupplier(supplierData);
      await loadSuppliers();
      setForm({ name: "", phone: "", email: "", address: "" });
      setAddDialogOpen(false);
    } catch (e) {
      console.error("Create supplier error:", e);
      setError(e instanceof Error ? e.message : t('suppliers.createError'));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (s: Supplier) => {
    setEditingId(s.supplier_uuid);
    setEditForm({
      name: s.name || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
    });
  };

  const handleUpdate = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const updateData = {
        name: editForm.name?.trim(),
        phone: editForm.phone?.trim() || "",
        email: editForm.email?.trim() || "",
        address: editForm.address?.trim() || "",
      };

      await updateSupplier(id, updateData);
      await loadSuppliers();
      setEditingId(null);
      setEditForm({});
    } catch (e) {
      console.error("Update supplier error:", e);
      setError(e instanceof Error ? e.message : t('suppliers.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('suppliers.deleteConfirm'))) return;

    setLoading(true);
    setError(null);

    try {
      await deleteSupplier(id);
      await loadSuppliers();
    } catch (e) {
      console.error("Delete supplier error:", e);
      setError(e instanceof Error ? e.message : t('suppliers.deleteError'));
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm)
  );

  const totalSuppliers = suppliers.length;
  const suppliersWithEmail = suppliers.filter((s) => s.email && s.email.trim()).length;
  const suppliersWithPhone = suppliers.filter((s) => s.phone && s.phone.trim()).length;

  return (
    <div className="min-h-screen bg-[#F8F9FC] p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-start">{t('suppliers.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('suppliers.subtitle')}</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2 bg-green-500 text-white">
          <IonIcon icon={addOutline} className="text-xl" />
          {t('suppliers.addSupplier')}
        </Button>
      </div>

      {/* Custom Add Supplier Modal */}
      {addDialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171717] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-[#171717] backdrop-blur-sm border-b border-gray-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{t('suppliers.addNewSupplier')}</h2>
              <button onClick={() => setAddDialogOpen(false)} className="text-gray-400 hover:text-gray-200 transition-colors">
                <IonIcon icon={closeOutline} className="text-2xl" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t('suppliers.supplierNameRequired')}
                </label>
                <Input
                  placeholder={t('suppliers.namePlaceholder')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t('suppliers.phoneLabel')}
                </label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t('suppliers.emailLabel')}
                </label>
                <Input
                  type="email"
                  placeholder="supplier@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t('suppliers.addressLabel')}
                </label>
                <Textarea
                  rows={3}
                  placeholder={t('suppliers.addressPlaceholder')}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>
            </div>
            <div className="border-t border-gray-700 px-6 py-4 flex justify-end gap-3 bg-bg-[#171717]">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-900/20">
                {loading ? t('suppliers.adding') : t('suppliers.addSupplier')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-start">
        <StatCard
          label={t('suppliers.totalSuppliers')}
          value={totalSuppliers}
          gradient="bg-gradient-to-br from-purple-500 to-purple-700"
          icon={<IonIcon icon={peopleOutline} className="w-5 h-5 text-white" />}
        />
        <StatCard
          label={t('suppliers.withEmail')}
          value={suppliersWithEmail}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          icon={<IonIcon icon={mailOutline} className="w-5 h-5 text-white" />}
        />
        <StatCard
          label={t('suppliers.withPhone')}
          value={suppliersWithPhone}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          icon={<IonIcon icon={callOutline} className="w-5 h-5 text-white" />}
        />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <IonIcon icon={searchOutline} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
        <Input
          placeholder={t('suppliers.searchPlaceholder')}
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

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex justify-between items-center">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <IonIcon icon={closeOutline} className="text-lg" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* Suppliers Table */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className=" text-slate-600 min-w-[150px]">{t('suppliers.tableSupplier')}</TableHead>
                <TableHead className=" text-slate-600 min-w-[200px]">{t('suppliers.tableContact')}</TableHead>
                <TableHead className=" text-slate-600 min-w-[200px]">{t('suppliers.tableAddress')}</TableHead>
                <TableHead className=" text-slate-600 min-w-[100px]">{t('suppliers.tableStatus')}</TableHead>
                <TableHead className=" text-slate-600 min-w-[100px]">{t('suppliers.tableActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-start">
              {loading && suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    {searchTerm ? t('suppliers.noSearchResults') : t('suppliers.noSuppliers')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((s) => (
                  <TableRow key={s.supplier_uuid} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-800">{s.name || t('suppliers.unnamed')}</div>
                        {s.supplier_uuid && (
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {t('suppliers.idLabel')}: {s.supplier_uuid.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {s.phone && (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <IonIcon icon={callOutline} className="text-xs shrink-0" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                        {s.email && (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <IonIcon icon={mailOutline} className="text-xs shrink-0" />
                            <span className="truncate max-w-[180px]">{s.email}</span>
                          </div>
                        )}
                        {!s.phone && !s.email && (
                          <span className="text-xs text-slate-400">{t('suppliers.noContactInfo')}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.address ? (
                        <div className="flex items-start gap-1 text-sm text-slate-600">
                          <IonIcon icon={locationOutline} className="text-xs mt-0.5 shrink-0" />
                          <span className="line-clamp-2 break-words">{s.address}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">{t('suppliers.noAddress')}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-start">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                        <IonIcon icon={checkmarkCircleOutline} className="text-xs mr-1" />
                        {t('suppliers.activeStatus')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-start">
                      <div className="flex items-start justify-start gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(s)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title={t('suppliers.editTitle')}
                        >
                          <IonIcon icon={createOutline} className="text-lg" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(s.supplier_uuid)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title={t('suppliers.deleteTitle')}
                        >
                          <IonIcon icon={trashOutline} className="text-lg" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Custom Edit Supplier Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{t('suppliers.editSupplier')}</h2>
              <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">
                <IonIcon icon={closeOutline} className="text-2xl" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('suppliers.supplierName')}
                </label>
                <Input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('suppliers.phoneLabel')}
                </label>
                <Input
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('suppliers.emailLabel')}
                </label>
                <Input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('suppliers.addressLabel')}
                </label>
                <Textarea
                  rows={3}
                  value={editForm.address || ""}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
              <Button onClick={() => editingId && handleUpdate(editingId)} disabled={loading}>
                {loading ? t('suppliers.saving') : t('suppliers.saveChanges')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}