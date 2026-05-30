import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../renderer/services/customerApi";
import CustomerLedgerModal from "./CustomerLedgerPage";
import { apiGet } from "../../renderer/services/api";
import { IonIcon } from "@ionic/react";
import {
  personAddOutline,
  createOutline,
  trashOutline,
  eyeOutline,
  closeOutline,
  peopleOutline,
  cashOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  timeOutline,
  callOutline,
  searchOutline,
} from "ionicons/icons";

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "../../../@/components/ui/card";
import { Button } from "../../../@/components/ui/button";
import { Input } from "../../../@/components/ui/input";
import { Textarea } from "../../../@/components/ui/textarea";
import { Badge } from "../../../@/components/ui/badge";
import { ScrollArea } from "../../../@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../@/components/ui/dialog";

// ── Reusable StatCard (same as other pages)
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

export default function CustomerPage() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    address: "",
    gstin: "",
    credit_limit: 0,
  });

  const [aging, setAging] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);

  // Load all data
  useEffect(() => {
    loadCustomers();
    loadInsights();
  }, []);

  const loadAllCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadCustomers(), loadInsights()]);
    } catch (error) {
      console.error("Error loading customer data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllCustomerData();
  }, [refreshKey, loadAllCustomerData]);

  useEffect(() => {
    const handleRefresh = () => setRefreshKey(prev => prev + 1);
    window.addEventListener('refresh-customers', handleRefresh);
    return () => window.removeEventListener('refresh-customers', handleRefresh);
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading customers:", e);
      setCustomers([]);
    }
  };

  const loadInsights = async () => {
    try {
      const [agingResponse, reminderResponse] = await Promise.all([
        apiGet("/customers/aging"),
        apiGet("/customers/reminders"),
      ]);

      let agingData = [];
      if (agingResponse.success && agingResponse.data) agingData = agingResponse.data;
      else if (agingResponse.data && Array.isArray(agingResponse.data)) agingData = agingResponse.data;
      else if (Array.isArray(agingResponse)) agingData = agingResponse;

      let reminderData = [];
      if (reminderResponse.success && reminderResponse.data) reminderData = reminderResponse.data;
      else if (reminderResponse.data && Array.isArray(reminderResponse.data)) reminderData = reminderResponse.data;
      else if (Array.isArray(reminderResponse)) reminderData = reminderResponse;

      setAging(agingData);
      setReminders(reminderData);
    } catch (e) {
      console.error("Insights error:", e);
      setAging([]);
      setReminders([]);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", mobile: "", address: "", gstin: "", credit_limit: 0 });
    setDialogOpen(false);
  };

  const handleSave = async () => {
    if (!form.name) return alert(t('customers.nameRequired'));
    try {
      if (editing) {
        await updateCustomer(editing.customer_uuid, form);
        alert(t('customers.updateSuccess'));
      } else {
        await createCustomer(form);
        alert(t('customers.createSuccess'));
      }
      await loadCustomers();
      resetForm();
    } catch (e) {
      console.error(e);
      alert(t('customers.saveFailed'));
    }
  };

  const handleEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name,
      mobile: c.mobile || "",
      address: c.address || "",
      gstin: c.gstin || "",
      credit_limit: c.credit_limit || 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm(t('customers.deleteConfirm'))) return;
    try {
      await deleteCustomer(uuid);
      alert(t('customers.deleteSuccess'));
      await loadCustomers();
    } catch (e) {
      console.error("Delete failed:", e);
      alert(t('customers.deleteFailed'));
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile?.includes(searchTerm)
  );

  const totalCustomers = customers.length;
  const totalCredit = customers.reduce((sum, c) => sum + (Number(c.credit_balance) || 0), 0);
  const overdueCustomers = customers.filter((c) => (Number(c.credit_balance) || 0) > (Number(c.credit_limit) || 0)).length;
  const activeCustomers = customers.filter((c) => (Number(c.credit_balance) || 0) === 0).length;

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('customers.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('customers.subtitle')}</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2 bg-green-500 text-white">
          <IonIcon icon={personAddOutline} className="text-xl" />
          {t('customers.addCustomer')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-start">
        <StatCard
          label={t('customers.totalCustomers')}
          value={totalCustomers}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          icon={<IonIcon icon={peopleOutline} className="w-5 h-5 text-white" />}
        />
        <StatCard
          label={t('customers.totalCreditOutstanding')}
          value={`₹${totalCredit.toLocaleString()}`}
          gradient="bg-gradient-to-br from-violet-500 to-violet-700"
          icon={<IonIcon icon={cashOutline} className="w-5 h-5 text-white" />}
        />
        <StatCard
          label={t('customers.overdueAccounts')}
          value={overdueCustomers}
          gradient="bg-gradient-to-br from-amber-500 to-amber-700"
          icon={<IonIcon icon={alertCircleOutline} className="w-5 h-5 text-white" />}
        />
        <StatCard
          label={t('customers.activeCustomers')}
          value={activeCustomers}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          icon={<IonIcon icon={checkmarkCircleOutline} className="w-5 h-5 text-white" />}
        />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <IonIcon icon={searchOutline} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
        <Input
          placeholder={t('customers.searchPlaceholder')}
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

      {/* Main Grid: Insights + Customer List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column - Credit Aging & Reminders */}
        <div className="space-y-5">
          {/* Credit Aging */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <div className="p-1 bg-orange-100 rounded-lg">
                  <IonIcon icon={timeOutline} className="text-orange-500 text-lg" />
                </div>
                {t('customers.creditAging')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aging.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">{t('customers.noAgingData')}</div>
              ) : (
                <div className="space-y-4">
                  {aging.slice(0, 5).map((c, i) => (
                    <div key={i} className="border-b border-slate-100 last:border-0 pb-3">
                      <div className="font-medium text-slate-800 mb-2">{c.name}</div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center p-1 bg-slate-50 rounded">
                          <div className="text-slate-400">0-30</div>
                          <div className="font-semibold text-slate-700">₹{c.aging?.["0_30"] || 0}</div>
                        </div>
                        <div className="text-center p-1 bg-slate-50 rounded">
                          <div className="text-slate-400">31-60</div>
                          <div className="font-semibold text-slate-700">₹{c.aging?.["31_60"] || 0}</div>
                        </div>
                        <div className="text-center p-1 bg-slate-50 rounded">
                          <div className="text-slate-400">61-90</div>
                          <div className="font-semibold text-slate-700">₹{c.aging?.["61_90"] || 0}</div>
                        </div>
                        <div className="text-center p-1 bg-red-50 rounded">
                          <div className="text-slate-400">90+</div>
                          <div className="font-semibold text-red-600">₹{c.aging?.["90_plus"] || 0}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Reminders */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <div className="p-1 bg-red-100 rounded-lg">
                  <IonIcon icon={alertCircleOutline} className="text-red-500 text-lg" />
                </div>
                {t('customers.paymentReminders')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reminders.length === 0 ? (
                <div className="text-center py-6 text-emerald-600 text-sm flex items-center justify-center gap-2">
                  <IonIcon icon={checkmarkCircleOutline} className="text-lg" />
                  {t('customers.noPendingDues')}
                </div>
              ) : (
                <ScrollArea className="h-[250px] pr-2">
                  <div className="space-y-2">
                    {reminders.slice(0, 5).map((r: any, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <div>
                          <div className="font-medium text-slate-800">{r.name}</div>
                          <div className="text-xs text-red-500">{t('customers.daysOverdue', { days: r.days })}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">₹{r.due || 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer List */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="border-b border-slate-100">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-semibold text-slate-800">{t('customers.customerList')}</CardTitle>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                  {t('customers.customersFound', { count: filteredCustomers.length })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    {searchTerm ? t('customers.noSearchResults') : t('customers.noCustomers')}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredCustomers.map((c) => {
                      const creditBalance = Number(c.credit_balance) || 0;
                      const creditLimit = Number(c.credit_limit) || 0;
                      const availableCredit = creditLimit - creditBalance;
                      const isOverdue = creditBalance > creditLimit;
                      const creditPercentage = Math.min((creditBalance / (creditLimit || 1)) * 100, 100);

                      return (
                        <div key={c.customer_uuid} className="p-4 hover:bg-slate-50/80 transition-colors group">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                  <span className="text-blue-600 font-semibold">{c.name?.charAt(0).toUpperCase() || '?'}</span>
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-slate-800 truncate">{c.name}</h3>
                                  {c.mobile && (
                                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                      <IonIcon icon={callOutline} className="text-xs" />
                                      <span className="truncate">{c.mobile}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Credit Info */}
                              <div className="mt-3 ml-13">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-slate-500">{t('customers.creditUsed')}</span>
                                  <span className={isOverdue ? "text-red-600 font-semibold" : "text-slate-700"}>
                                    ₹{creditBalance.toLocaleString()} / ₹{creditLimit.toLocaleString()}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${isOverdue ? "bg-red-500" : "bg-emerald-500"}`}
                                    style={{ width: `${creditPercentage}%` }}
                                  />
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  {t('customers.availableCredit')}: ₹{availableCredit.toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedCustomer(c)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title={t('customers.viewLedger')}
                              >
                                <IonIcon icon={eyeOutline} className="text-lg" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(c)}
                                className="text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                                title={t('customers.edit')}
                              >
                                <IonIcon icon={createOutline} className="text-lg" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(c.customer_uuid)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title={t('customers.delete')}
                              >
                                <IonIcon icon={trashOutline} className="text-lg" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Customer Dialog (shadcn Dialog) */}
      {/* Customer Add/Edit Modal – Premium Dark UI (matching supplier page) */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171717] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-[#171717] backdrop-blur-sm border-b border-gray-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {editing ? t('customers.editCustomer') : t('customers.addNewCustomer')}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-200 transition-colors">
                <IonIcon icon={closeOutline} className="text-2xl" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t('customers.nameField')} *
                </label>
                <Input
                  placeholder={t('customers.namePlaceholder')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t('customers.mobileField')}
                </label>
                <Input
                  placeholder={t('customers.mobilePlaceholder')}
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t('customers.addressField')}
                </label>
                <Textarea
                  rows={3}
                  placeholder={t('customers.addressPlaceholder')}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none resize-vertical focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t('customers.gstinField')}
                </label>
                <Input
                  placeholder={t('customers.gstinPlaceholder')}
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t('customers.creditLimitField')}
                </label>
                <Input
                  type="number"
                  placeholder={t('customers.creditLimitPlaceholder')}
                  value={form.credit_limit}
                  onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>
            </div>

            <div className="border-t border-gray-700 px-6 py-4 flex justify-end gap-3 bg-[#171717]">
              <Button variant="outline" onClick={resetForm} className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-900/20">
                {loading ? (editing ? t('customers.updating') : t('customers.adding')) : (editing ? t('customers.updateCustomer') : t('customers.createCustomer'))}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Ledger Modal (external component, unchanged) */}
      {selectedCustomer && (
        <CustomerLedgerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}