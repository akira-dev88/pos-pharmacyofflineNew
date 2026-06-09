import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../../components/LanguageToggle";
import {
  getSettings,
  saveSettings,
  createBackup,
  listBackups,
  restoreBackup,
  getLicenseStatus,
  activateLicense,
} from "../../renderer/services/settingsApi";
import { IonIcon } from "@ionic/react";
import { useAuth } from "../../context/AuthContext";
import { getProfile, type UserProfile, type ShopProfile } from "../../renderer/services/profileApi";
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
  keyOutline,
  shieldCheckmarkOutline,
  checkmarkCircle,
  closeCircleOutline,
  mailOutline,
  copyOutline,
  checkmarkOutline,
  calendarOutline,
  timeOutline,
  personCircleOutline,
  logOutOutline,
} from "ionicons/icons";

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
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [licenseKey, setLicenseKey] = useState("");
  const [activating, setActivating] = useState(false);
  const { user: authUser, logout } = useAuth();
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await getProfile();
      setProfileUser(response.data.user);
    } catch {
      if (authUser) {
        setProfileUser(authUser as UserProfile);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

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

  const loadLicenseStatus = async () => {
    try {
      const res = await getLicenseStatus();
      setLicenseStatus(res);
    } catch (err) {
      console.error("Failed to load license status:", err);
    }
  };

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError("License key is required");
      return;
    }
    setActivating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await activateLicense(licenseKey.trim());
      if (res?.success) {
        setSuccess("License activated successfully!");
        await loadLicenseStatus();
        setLicenseKey("");
      } else {
        setError(res?.error || "License activation failed");
      }
    } catch (err) {
      setError("License activation failed");
    } finally {
      setActivating(false);
    }
  };

  useEffect(() => {
    syncFromBackend();
    loadBackups();
    loadLicenseStatus();
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

  if (loading && !data) {
    return (
      <div style={{ background: "#ffffff" }} className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ background: "#ffffff" }} className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-8 text-center max-w-md w-full">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <IonIcon icon={warningOutline} className="text-2xl text-red-400" />
          </div>
          <p style={{ color: "#374151" }} className="text-sm">{t("settings.loadFailed")}</p>
          <button onClick={handleRefresh} className="mt-5 btn btn-primary">
            {t("settings.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh" }}>

      <style>{`
        body {
          background-color: #f5f7fa;
          color: #374151;
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      {/* Success / Error Messages */}
      {(success || error) && (
        <div style={{ maxWidth: 760, margin: "18px auto 0", padding: "0 32px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 16px", borderRadius: 10, fontSize: "0.85rem",
            background: success ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${success ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
            color: success ? "#16a34a" : "#dc2626"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IonIcon icon={success ? checkmarkCircleOutline : warningOutline} className="text-2xl" />
              <span>{success || error}</span>
            </div>
            <button onClick={() => { setSuccess(null); setError(null); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", opacity: 0.6 }}>
              <IonIcon icon={closeOutline} className="text-2xl" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "28px 32px 48px" }}>

        {/* Profile */}
        <div className="settings-section" style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", marginBottom: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="section-header" style={{ padding: "16px 20px 15px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
            <div className="section-icon green" style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>
              <IonIcon icon={personCircleOutline} className="text-xl" />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Profile</div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 1 }}>Your account information</div>
            </div>
            <button onClick={loadProfile} className="edit-inline" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.8rem", fontWeight: 500, color: "#6b7280", cursor: "pointer", transition: "all 0.15s" }}>
              <IonIcon icon={refreshOutline} className="text-base" />
              Refresh
            </button>
          </div>
          {profileLoading ? (
            <div className="setting-row" style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
            </div>
          ) : profileUser ? (
            <>
              <div className="setting-row" style={{ padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    {profileUser.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827" }}>{profileUser.name}</div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{profileUser.email}</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border" style={{
                  background: profileUser.role === "owner" ? "#fffbeb" : profileUser.role === "manager" ? "#f0f9ff" : "#ecfdf5",
                  color: profileUser.role === "owner" ? "#b45309" : profileUser.role === "manager" ? "#0369a1" : "#047857",
                  borderColor: profileUser.role === "owner" ? "#fde68a" : profileUser.role === "manager" ? "#bae6fd" : "#a7f3d0",
                }}>
                  {profileUser.role?.charAt(0).toUpperCase() + profileUser.role?.slice(1) || "User"}
                </span>
              </div>
              {profileUser.user_uuid && (
                <div className="setting-row" style={{ padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>User ID</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.85rem", color: "#6b7280", fontFamily: "monospace" }}>{profileUser.user_uuid}</span>
                    <button onClick={() => copyToClipboard(profileUser.user_uuid!)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition" title="Copy User ID">
                      <IonIcon icon={copied ? checkmarkOutline : copyOutline} className={`text-sm ${copied ? "text-green-600" : "text-gray-400"}`} />
                    </button>
                  </div>
                </div>
              )}
              <div className="setting-row" style={{ padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>Account Dates</span>
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: "0.85rem", color: "#6b7280" }}>
                  <span><IonIcon icon={calendarOutline} className="mr-1" /> Created: 01 Jan 2025</span>
                  <span><IonIcon icon={timeOutline} className="mr-1" /> Last Login: 07 Jun 2026</span>
                </div>
              </div>
            </>
          ) : (
            <div className="setting-row" style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: "0.85rem" }}>
              Could not load profile data
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="settings-section" style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", marginBottom: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="section-header" style={{ padding: "16px 20px 15px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
            <div className="section-icon blue" style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(37,99,235,0.1)", color: "#2563eb" }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
              </svg>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Preferences</div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 1 }}>Behaviour and automation settings</div>
            </div>
          </div>
          <div className="setting-row" style={{ padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>{t("settings.autoPrintBill")}</div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 2 }}>{t("settings.autoPrintDesc")}</div>
            </div>
            <label className="toggle" style={{ position: "relative", width: 40, height: 22, flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={data.auto_print === 1}
                onChange={(e) => {
                  const newAutoPrint = e.target.checked ? 1 : 0;
                  setData({ ...data, auto_print: newAutoPrint });
                  localStorage.setItem("shop_settings", JSON.stringify({ ...data, auto_print: newAutoPrint }));
                  saveSettings({ ...data, auto_print: newAutoPrint }).catch(console.error);
                }}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="toggle-slider" style={{ position: "absolute", inset: 0, background: data.auto_print === 1 ? "#16a34a" : "#e5e7eb", borderRadius: 22, cursor: "pointer", transition: "0.2s" }}>
                <span style={{ position: "absolute", width: 16, height: 16, left: 3, top: 3, background: "white", borderRadius: "50%", transition: "0.2s", transform: data.auto_print === 1 ? "translateX(18px)" : "none" }} />
              </span>
            </label>
          </div>
          <div className="setting-row" style={{ padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>Language</div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 2 }}>Switch between English and Tamil</div>
            </div>
            <LanguageToggle />
          </div>
        </div>

        {/* Business Information */}
        <div className="settings-section" style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", marginBottom: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="section-header" style={{ padding: "16px 20px 15px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
            <div className="section-icon purple" style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(139,92,246,0.1)", color: "#7c3aed" }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>{t("settings.businessInformation")}</div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 1 }}>Store name, contact, and invoice settings</div>
            </div>
            <button onClick={openEditModal} className="edit-inline" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.8rem", fontWeight: 500, color: "#6b7280", cursor: "pointer", transition: "all 0.15s" }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit
            </button>
          </div>
          <div className="setting-row" style={{ padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>{t("settings.businessName")}</span>
            <span style={{ fontSize: "0.85rem", color: "#6b7280", fontFamily: "inherit" }}>{data.shop_name || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>— Not set</span>}</span>
          </div>
          <div className="setting-row" style={{ padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>{t("settings.contactNumber")}</span>
            <span style={{ fontSize: "0.85rem", color: "#6b7280", fontFamily: "inherit" }}>{data.mobile || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>— Not set</span>}</span>
          </div>
          <div className="setting-row" style={{ padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>{t("settings.addressLabel")}</span>
            <span style={{ fontSize: "0.85rem", color: "#6b7280", fontFamily: "inherit" }}>{data.address || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>— Not set</span>}</span>
          </div>
          <div className="setting-row" style={{ padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>{t("settings.invoicePrefixLabel")}</div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 2 }}>Prepended to all invoice numbers</div>
            </div>
            <input
              className="setting-input"
              type="text"
              value={data.invoice_prefix || "INV"}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setData({ ...data, invoice_prefix: val });
                localStorage.setItem("shop_settings", JSON.stringify({ ...data, invoice_prefix: val }));
                saveSettings({ ...data, invoice_prefix: val }).catch(console.error);
              }}
              maxLength={6}
              style={{ background: "#f9fafb", border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 11px", fontSize: "0.85rem", fontFamily: "inherit", color: "#111827", width: 120, outline: "none" }}
            />
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="settings-section" style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", marginBottom: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="section-header" style={{ padding: "16px 20px 15px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
            <div className="section-icon yellow" style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(245,158,11,0.1)", color: "#d97706" }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>{t("settings.backupRestore")}</div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 1 }}>Protect your data with regular backups</div>
            </div>
            <button onClick={handleBackup} disabled={backupLoading} className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, cursor: backupLoading ? "not-allowed" : "pointer", transition: "all 0.15s", border: "none", outline: "none", background: "transparent", color: "#2563eb", border: "1px solid rgba(37,99,235,0.25)", opacity: backupLoading ? 0.5 : 1 }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            {backupLoading ? t("settings.creatingBackup") : t("settings.backupNow")}
          </button>
          </div>
          {backups.length === 0 ? (
            <div className="backup-empty" style={{ padding: "26px 20px", textAlign: "center", color: "#9ca3af", fontSize: "0.85rem" }}>
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 9px", opacity: 0.28, display: "block" }}>
                <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
              </svg>
              {t("settings.noBackups")}
            </div>
          ) : (
            <div style={{ maxHeight: 250, overflowY: "auto" }}>
              {backups.map((backup, index) => (
                <div key={index} className="setting-row" style={{ padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
                  <div>
                    <p style={{ fontSize: "0.9rem", fontFamily: "inherit", color: "#374151" }}>{backup.name}</p>
                    <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 2 }}>
                      {new Date(backup.date).toLocaleString("en-IN")} · {(backup.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(backup.name)}
                    disabled={backupLoading}
                    className="edit-inline"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.8rem", fontWeight: 500, color: "#dc2626", cursor: backupLoading ? "not-allowed" : "pointer", transition: "all 0.15s", opacity: backupLoading ? 0.5 : 1 }}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    {t("settings.restore")}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="info-note" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.12)", borderRadius: 8, padding: "10px 13px", fontSize: "0.8rem", color: "#6b7280", margin: "0 20px 18px", textAlign: "center" }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 0, color: "#2563eb" }}>
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span style={{ textAlign: "center" }}>⚡ {t("settings.autoBackupNote")} <code style={{ fontFamily: "inherit", color: "#2563eb", fontSize: "0.75rem", background: "rgba(37,99,235,0.08)", padding: "1px 5px", borderRadius: 3 }}>%APPDATA%\pos-app\backups\</code> {t("settings.onWindows")}</span>
          </div>
        </div>

        {/* License Management */}
        <div className="settings-section" style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", marginBottom: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="section-header" style={{ padding: "16px 20px 15px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
            <div className="section-icon green" style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>License Management</div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 1 }}>Software activation and key management</div>
            </div>
          </div>
          <div className="setting-row" style={{ padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>Status</div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 2 }}>Current activation state</div>
            </div>
            <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 600, background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: "#16a34a", boxShadow: "0 0 5px #16a34a" }} />
              {licenseStatus?.licensed ? "Licensed" : "Not Licensed"}
            </span>
          </div>
          <div className="setting-row" style={{ padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>Activate License</div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: 3 }}>
                {licenseStatus?.licensed ? "Already activated on this machine" : "Enter your license key to activate"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="setting-input"
                type="text"
                placeholder="License key"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                disabled={licenseStatus?.licensed}
                style={{ background: "#f9fafb", border: "1px solid #d1d5db", borderRadius: 7, padding: "7px 11px", fontSize: "0.85rem", fontFamily: "inherit", color: "#111827", width: 140, outline: "none", opacity: licenseStatus?.licensed ? 0.38 : 1 }}
              />
              <button
                onClick={handleActivate}
                disabled={activating || licenseStatus?.licensed}
                className="btn btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, cursor: (activating || licenseStatus?.licensed) ? "not-allowed" : "pointer", transition: "all 0.15s", border: "none", outline: "none", background: licenseStatus?.licensed ? "#d1d5db" : "#2563eb", color: licenseStatus?.licensed ? "#6b7280" : "#fff", opacity: (activating || licenseStatus?.licensed) ? 0.5 : 1 }}
              >
                {activating ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" style={{ display: "inline-block" }} />
                ) : (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                  </svg>
                )}
                Activate
              </button>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="settings-section" style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="section-header" style={{ padding: "16px 20px 15px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
            <div className="section-icon" style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>
              <IonIcon icon={logOutOutline} className="text-xl" />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>Logout</div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: 1 }}>Sign out of your account</div>
            </div>
          </div>
          <div className="setting-row" style={{ padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>Are you sure you want to logout?</span>
            <button
              onClick={logout}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, color: "#fff", background: "#dc2626", border: "none", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#b91c1c"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#dc2626"; }}
            >
              <IonIcon icon={logOutOutline} className="text-base" />
              Logout
            </button>
          </div>
        </div>

      </div>

      {/* Custom Edit Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{t("settings.editSettings")}</h2>
              <button onClick={() => setDialogOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <IonIcon icon={closeOutline} className="text-2xl" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-start font-semibold text-slate-700 mb-1.5">
                  {t("settings.shopName")} *
                </label>
                <input
                  placeholder={t("settings.shopNamePlaceholder")}
                  value={formData.shop_name || ""}
                  onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                  className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-start font-semibold text-slate-700 mb-1.5">
                  {t("settings.mobileNumber")}
                </label>
                <input
                  placeholder="+91 98765 43210"
                  value={formData.mobile || ""}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-start font-semibold text-slate-700 mb-1.5">
                  {t("settings.address")}
                </label>
                <textarea
                  rows={3}
                  placeholder={t("settings.addressPlaceholder")}
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-start font-semibold text-slate-700 mb-1.5">
                  {t("settings.gstinNumber")}
                </label>
                <input
                  placeholder="22AAAAA0000A1Z"
                  className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all outline-none uppercase"
                  value={formData.gstin || ""}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-sm text-start font-semibold text-slate-700 mb-1.5">
                  {t("settings.invoicePrefix")}
                </label>
                <input
                  placeholder="INV"
                  className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all outline-none uppercase"
                  value={formData.invoice_prefix || "INV"}
                  onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value.toUpperCase() })}
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  {t("settings.exampleInvoice")} {formData.invoice_prefix || "INV"}-0001
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 bg-white">
              <button onClick={() => setDialogOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
                {t("common.cancel")}
              </button>
              <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all ${saving ? 'bg-green-500/50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 cursor-pointer'}`}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {t("settings.saving")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <IonIcon icon={saveOutline} className="text-2xl" />
                    Save Changes
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
