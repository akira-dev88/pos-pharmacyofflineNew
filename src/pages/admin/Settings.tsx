import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getSettings,
  saveSettings,
  createBackup,
  listBackups,
  restoreBackup,
} from "../../renderer/services/settingsApi";
import { apiPost } from "../../renderer/services/api";
import { IonIcon } from "@ionic/react";
import {
  saveOutline,
  closeOutline,
  checkmarkCircleOutline,
  warningOutline,
  businessOutline,
  callOutline,
  locationOutline,
  documentTextOutline,
  pricetagOutline,
  refreshOutline,
  cloudUploadOutline,
  cloudDownloadOutline,
  createOutline,
} from "ionicons/icons";

// shadcn/ui components (except Dialog)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

const DEFAULT_SETTINGS = {
  shop_name: "",
  mobile: "",
  address: "",
  gstin: "",
  invoice_prefix: "INV",
  auto_print: 0,
};

export default function Settings() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);

  const extractCleanSettings = (obj: any) => {
    if (!obj) return null;
    let source = obj;
    if (obj.data && typeof obj.data === "object") source = obj.data;
    return {
      shop_name: source.shop_name || "",
      mobile: source.mobile || "",
      address: source.address || "",
      gstin: source.gstin || "",
      invoice_prefix: source.invoice_prefix || "INV",
      auto_print: source.auto_print ?? 0,
    };
  };

  // Load from localStorage first
  useEffect(() => {
    const cached = localStorage.getItem("shop_settings");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const clean = extractCleanSettings(parsed);
        if (clean) setData({ ...DEFAULT_SETTINGS, ...clean });
        else setData({ ...DEFAULT_SETTINGS });
      } catch (err) {
        setData({ ...DEFAULT_SETTINGS });
      }
    } else {
      setData({ ...DEFAULT_SETTINGS });
    }
    setLoading(false);
  }, []);

  const syncFromBackend = async () => {
    try {
      const res = await getSettings();
      const clean = extractCleanSettings(res);
      if (clean && (clean.shop_name || clean.mobile || clean.address)) {
        setData((prev: any) => ({ ...prev, ...clean }));
        localStorage.setItem("shop_settings", JSON.stringify(clean));
      }
    } catch (err) {
      console.error("Failed to sync from backend:", err);
    }
  };

  useEffect(() => {
    syncFromBackend();
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const res = await listBackups();
      if (res?.data) setBackups(res.data);
    } catch (err) {
      console.error("Failed to load backups:", err);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      await createBackup();
      setSuccess(t("settings.backupSuccess"));
      await loadBackups();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t("settings.backupError"));
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async (backupName: string) => {
    if (!confirm(t("settings.restoreConfirm", { name: backupName }))) return;
    setBackupLoading(true);
    try {
      await restoreBackup(backupName);
      setSuccess(t("settings.restoreSuccess"));
      await syncFromBackend();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(t("settings.restoreError"));
    } finally {
      setBackupLoading(false);
    }
  };

  const openEditModal = () => {
    if (data) {
      setFormData({
        shop_name: data.shop_name || "",
        mobile: data.mobile || "",
        address: data.address || "",
        gstin: data.gstin || "",
        invoice_prefix: data.invoice_prefix || "INV",
        auto_print: data.auto_print ?? 0,
      });
      setDialogOpen(true);
    }
  };

  const handleSave = async () => {
    if (!formData.shop_name) {
      setError(t("settings.shopNameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await saveSettings(formData);
      const toStore = {
        shop_name: formData.shop_name,
        mobile: formData.mobile,
        address: formData.address,
        gstin: formData.gstin,
        invoice_prefix: formData.invoice_prefix,
        auto_print: formData.auto_print,
      };
      localStorage.setItem("shop_settings", JSON.stringify(toStore));
      setData((prev: any) => ({ ...prev, ...toStore }));
      setSuccess(t("settings.saveSuccess"));
      setTimeout(() => setSuccess(null), 3000);
      setDialogOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      setError(t("settings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    await syncFromBackend();
    await loadBackups();
  };

  const handleTestPrint = async () => {
    try {
      const res = await apiPost("/settings/test-print", {});
      if (res.success) setSuccess(t("settings.testPrintSuccess"));
      else setError(`${t("settings.testPrintError")}: ${res.error}`);
    } catch (err) {
      setError(t("settings.testPrintError"));
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <IonIcon icon={warningOutline} className="text-5xl text-red-500 mx-auto mb-3" />
            <p className="text-red-700">{t("settings.loadFailed")}</p>
            <Button onClick={handleRefresh} className="mt-4 bg-blue-600 hover:bg-blue-700">
              {t("settings.retry")}
            </Button>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-start">{t("settings.title")}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t("settings.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <IonIcon icon={refreshOutline} className="text-lg" />
            {t("settings.refresh")}
          </Button>
          <Button variant="outline" onClick={handleTestPrint} className="gap-2">
            <IonIcon icon={documentTextOutline} className="text-lg" />
            Test Print
          </Button>
        </div>
      </div>

      {/* Success / Error Messages */}
      {(success || error) && (
        <Card className={success ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}>
          <CardContent className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <IonIcon icon={success ? checkmarkCircleOutline : warningOutline} className="text-xl" />
              <p className="text-sm">{success || error}</p>
            </div>
            <button onClick={() => { setSuccess(null); setError(null); }}>
              <IonIcon icon={closeOutline} className="text-lg text-slate-500" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* Main editable section – button + quick toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button onClick={openEditModal} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <IonIcon icon={createOutline} className="text-lg" />
          Edit Store Settings
        </Button>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <Switch
              checked={data.auto_print === 1}
              className="border-2 border-gray-300 data-[state=checked]:border-green-500 data-[state=unchecked]:bg-black pb-[1px]"
              thumbClassName="bg-gray-400 data-[state=checked]:bg-green-500"
              onCheckedChange={(checked) => {
                const newAutoPrint = checked ? 1 : 0;
                setData({ ...data, auto_print: newAutoPrint });
                localStorage.setItem("shop_settings", JSON.stringify({ ...data, auto_print: newAutoPrint }));
                saveSettings({ ...data, auto_print: newAutoPrint }).catch(console.error);
              }}
            />
            <div>
              <p className={`text-sm font-medium transition-colors ${data.auto_print === 1 ? 'text-green-500' : 'text-gray-700'}`}>{t("settings.autoPrintBill")}</p>
              <p className="text-xs text-gray-500">{t("settings.autoPrintDesc")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two‑column layout: Business Info + Backup & Restore */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Business Information Summary Card */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2 text-white">
              <IonIcon icon={businessOutline} className="text-xl" />
              {t("settings.businessInformation")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IonIcon icon={businessOutline} className="text-blue-600 text-lg" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("settings.businessName")}</p>
                  <p className="text-sm font-medium text-slate-800">{data.shop_name || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <IonIcon icon={callOutline} className="text-green-600 text-lg" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("settings.contactNumber")}</p>
                  <p className="text-sm font-medium text-slate-800">{data.mobile || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <IonIcon icon={locationOutline} className="text-purple-600 text-lg" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("settings.addressLabel")}</p>
                  <p className="text-sm font-medium text-slate-800">{data.address || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <IonIcon icon={pricetagOutline} className="text-amber-600 text-lg" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("settings.invoicePrefixLabel")}</p>
                  <p className="text-sm font-medium text-slate-800">{data.invoice_prefix || "INV"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup & Restore Card */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-white">
                <IonIcon icon={cloudUploadOutline} className="text-xl" />
                {t("settings.backupRestore")}
              </CardTitle>
              <Button
                onClick={handleBackup}
                disabled={backupLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <IonIcon icon={cloudUploadOutline} />
                {backupLoading ? t("settings.creatingBackup") : t("settings.backupNow")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {backups.length === 0 ? (
              <div className="text-center py-8 text-slate-500">{t("settings.noBackups")}</div>
            ) : (
              <ScrollArea className="h-[250px] pr-2">
                <div className="space-y-2">
                  {backups.map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-mono text-slate-700">{backup.name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(backup.date).toLocaleString("en-IN")} · {(backup.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        onClick={() => handleRestore(backup.name)}
                        disabled={backupLoading}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <IonIcon icon={cloudDownloadOutline} className="mr-1" />
                        {t("settings.restore")}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-800">
                ⚡ {t("settings.autoBackupNote")}{" "}
                <span className="font-mono">%APPDATA%\pos-app\backups\</span> {t("settings.onWindows")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Edit Modal (replaces shadcn Dialog) */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#171717] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="sticky top-0 bg-[#171717] backdrop-blur-sm border-b border-gray-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{t("settings.editSettings")}</h2>
              <button onClick={() => setDialogOpen(false)} className="text-gray-400 hover:text-gray-200 transition-colors">
                <IonIcon icon={closeOutline} className="text-2xl" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t("settings.shopName")} *
                </label>
                <Input
                  placeholder={t("settings.shopNamePlaceholder")}
                  value={formData.shop_name || ""}
                  onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t("settings.mobileNumber")}
                </label>
                <Input
                  placeholder="+91 98765 43210"
                  value={formData.mobile || ""}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t("settings.address")}
                </label>
                <Textarea
                  rows={3}
                  placeholder={t("settings.addressPlaceholder")}
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none resize-vertical focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
              </div>
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t("settings.gstinNumber")}
                </label>
                <Input
                  placeholder="22AAAAA0000A1Z"
                  className="uppercase h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                  value={formData.gstin || ""}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-sm text-start font-bold text-gray-300 mb-1.5">
                  {t("settings.invoicePrefix")}
                </label>
                <Input
                  placeholder="INV"
                  className="uppercase h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                  value={formData.invoice_prefix || "INV"}
                  onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value.toUpperCase() })}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  {t("settings.exampleInvoice")} {formData.invoice_prefix || "INV"}-0001
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#171717] border-t border-gray-700 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {t("settings.saving")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <IonIcon icon={saveOutline} className="text-lg" />
                    {t("settings.saveChanges")}
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
