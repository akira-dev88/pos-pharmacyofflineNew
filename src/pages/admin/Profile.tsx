import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getProfile, type UserProfile, type ShopProfile } from "../../renderer/services/profileApi";
import { useAuth } from "../../context/AuthContext";
import { IonIcon } from "@ionic/react";
import {
  personOutline,
  mailOutline,
  keyOutline,
  businessOutline,
  cardOutline,
  calendarOutline,
  checkmarkCircleOutline,
  warningOutline,
  closeOutline,
  timeOutline,
  diamondOutline,
} from "ionicons/icons";

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "../../../@/components/ui/card";
import { Badge } from "../../../@/components/ui/badge";
import { Button } from "../../../@/components/ui/button";
import { Progress } from "../../../@/components/ui/progress";

export default function Profile() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProfile();
      const userData = response.data.user;
      const tenantData = response.data.tenant;
      setUser(userData);
      setTenant(tenantData);
    } catch (err) {
      console.error("Profile load error:", err);
      if (authUser) {
        setUser(authUser as UserProfile);
        setTenant({
          shop_name: "My Shop",
          invoice_prefix: "INV",
          is_active: true,
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } else {
        setError(t('profile.loadError'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-rose-200 shadow-xl">
          <CardContent className="p-6 text-center">
            <IonIcon icon={warningOutline} className="text-5xl text-rose-500 mx-auto mb-3" />
            <p className="text-rose-700">{error}</p>
            <Button onClick={loadProfile} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
              {t('profile.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  const isExpiringSoon = tenant?.expiry_date &&
    new Date(tenant.expiry_date) < new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const daysRemaining = tenant?.expiry_date
    ? Math.max(0, Math.ceil((new Date(tenant.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 365;
  const expiryProgress = tenant?.expiry_date
    ? Math.min(100, (daysRemaining / 365) * 100)
    : 100;

  // Role badge styling
  const getRoleBadge = (role: string) => {
    const styles = {
      owner: "bg-amber-100 text-amber-800 border-amber-200",
      manager: "bg-sky-100 text-sky-800 border-sky-200",
      cashier: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
    const roleKey = role === "owner" ? "owner" : role === "manager" ? "manager" : "cashier";
    return (
      <Badge variant="secondary" className={`${styles[roleKey]} font-medium px-3 py-1`}>
        {t(`profile.roles.${roleKey}`)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header – simple and elegant */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{t('profile.title')}</h1>
            <p className="text-slate-500 text-sm mt-1">{t('profile.subtitle')}</p>
          </div>
          <Button onClick={loadProfile} variant="outline" className="gap-2">
            <IonIcon icon={timeOutline} className="text-lg" />
            Refresh
          </Button>
        </div>

        {/* Two‑column layout with distinct styling */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Profile Card – modern, with large avatar */}
          <Card className="border-0 shadow-xl overflow-hidden bg-white">
            <div className="h-28 bg-gradient-to-r from-indigo-500 to-indigo-600" />
            <CardContent className="relative pt-0 pb-6 px-6">
              <div className="flex flex-col items-center -mt-14">
                <div className="w-28 h-28 rounded-full border-4 border-white bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mt-4">{user?.name}</h2>
                <div className="mt-2">{getRoleBadge(user?.role || "cashier")}</div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <IonIcon icon={mailOutline} className="text-indigo-500 text-xl shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-slate-800 truncate">{user?.email || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <IonIcon icon={keyOutline} className="text-indigo-500 text-xl shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Role</p>
                    <div>{getRoleBadge(user?.role || "cashier")}</div>
                  </div>
                </div>
                {user?.user_uuid && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">User ID</p>
                      <p className="text-xs font-mono text-slate-600 break-all">{user.user_uuid}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shop & Subscription Card – with progress bar */}
          <Card className="border-0 shadow-xl overflow-hidden bg-white">
            <div className="h-28 bg-gradient-to-r from-rose-500 to-rose-600" />
            <CardContent className="pt-6 px-6 pb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <IonIcon icon={businessOutline} className="text-rose-600 text-2xl" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Shop Details</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <IonIcon icon={businessOutline} className="text-rose-500 text-xl shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Shop Name</p>
                    <p className="text-sm font-medium text-slate-800">{tenant?.shop_name || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <IonIcon icon={cardOutline} className="text-rose-500 text-xl shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Invoice Prefix</p>
                    <p className="text-sm font-medium text-slate-800">{tenant?.invoice_prefix || "INV"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <IonIcon icon={checkmarkCircleOutline} className="text-rose-500 text-xl shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                    <Badge
                      variant="secondary"
                      className={`${tenant?.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                    >
                      <IonIcon icon={tenant?.is_active ? checkmarkCircleOutline : closeOutline} className="text-xs mr-1" />
                      {tenant?.is_active ? t('profile.active') : t('profile.inactive')}
                    </Badge>
                  </div>
                </div>

                {/* Subscription expiry with progress bar */}
                {tenant?.expiry_date && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <IonIcon icon={calendarOutline} className={`text-lg ${isExpiringSoon ? "text-amber-500" : "text-emerald-500"}`} />
                        <span className="text-sm font-semibold text-slate-700">Subscription Expiry</span>
                      </div>
                      <span className={`text-sm font-bold ${isExpiringSoon ? "text-amber-600" : "text-emerald-600"}`}>
                        {daysRemaining} days left
                      </span>
                    </div>
                    <Progress value={expiryProgress} className="h-2" />
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(tenant.expiry_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    {isExpiringSoon && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <IonIcon icon={warningOutline} className="text-xs" />
                        Renewal recommended soon
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}