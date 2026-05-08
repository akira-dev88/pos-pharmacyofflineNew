import { useEffect, useState } from "react";
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

export default function Profile() {
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

      // Access the data correctly
      const userData = response.data.user;
      const tenantData = response.data.tenant;

      console.log("User data:", userData);
      console.log("Tenant data:", tenantData);

      setUser(userData);
      setTenant(tenantData);
    } catch (err) {
      console.error("Profile load error:", err);

      // Fallback to auth context user
      if (authUser) {
        setUser(authUser as UserProfile);
        setTenant({
          shop_name: "My Shop",
          invoice_prefix: "INV",
          is_active: true,
          expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else {
        setError("Failed to load profile data");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
            <IonIcon icon={warningOutline} className="text-5xl text-red-500 mx-auto mb-3" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadProfile}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isExpiringSoon = tenant?.expiry_date &&
    new Date(tenant.expiry_date) < new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  const getDaysRemaining = () => {
    if (!tenant?.expiry_date) return 365;
    const today = new Date();
    const expiry = new Date(tenant.expiry_date);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="font-inter text-start">
          <h1 className="text-3xl font-bold text-white font-inter">Profile</h1>
          <p className="text-gray-500 text-sm font-inter">
            Manage your account and subscription details
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl px-4 py-2 text-white">
          <div className="flex items-center gap-2">
            <IonIcon icon={personOutline} className="text-xl" />
            <span className="font-semibold capitalize">{user?.role || "User"}</span>
          </div>
        </div>
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <div className="flex items-center gap-2">
              <IonIcon icon={personOutline} className="text-white text-xl" />
              <h2 className="text-white font-semibold text-lg">User Information</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{user?.name || "User"}</h3>
                <p className="text-gray-500 text-sm capitalize">{user?.role || "User"}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <IonIcon icon={personOutline} className="text-green-500 text-lg" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm font-medium text-gray-800">{user?.name || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <IonIcon icon={mailOutline} className="text-green-500 text-lg" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Email Address</p>
                  <p className="text-sm font-medium text-gray-800">{user?.email || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <IonIcon icon={keyOutline} className="text-green-500 text-lg" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Role</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${user?.role === "owner"
                      ? "bg-purple-100 text-purple-700"
                      : user?.role === "manager"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "User"}
                  </span>
                </div>
              </div>

              {user?.user_uuid && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">User ID</p>
                    <p className="text-xs font-mono text-gray-600">{user.user_uuid}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shop/Subscription Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <div className="flex items-center gap-2">
              <IonIcon icon={businessOutline} className="text-white text-xl" />
              <h2 className="text-white font-semibold text-lg">Shop Information</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <IonIcon icon={businessOutline} className="text-purple-500 text-lg" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Shop Name</p>
                  <p className="text-sm font-medium text-gray-800">{tenant?.shop_name || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <IonIcon icon={cardOutline} className="text-purple-500 text-lg" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Invoice Prefix</p>
                  <p className="text-sm font-medium text-gray-800">{tenant?.invoice_prefix || "INV"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <IonIcon icon={checkmarkCircleOutline} className="text-purple-500 text-lg" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`inline-flex items-center gap-1 text-sm font-medium ${tenant?.is_active ? "text-green-600" : "text-red-600"
                    }`}>
                    <IonIcon icon={tenant?.is_active ? checkmarkCircleOutline : closeOutline} className="text-sm" />
                    {tenant?.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {tenant?.expiry_date && (
                <div className={`flex items-center gap-3 p-3 rounded-lg ${isExpiringSoon && tenant?.is_active ? "bg-orange-50" : "bg-green-50"
                  }`}>
                  <IonIcon icon={calendarOutline} className={`text-lg ${isExpiringSoon && tenant?.is_active ? "text-orange-500" : "text-green-500"
                    }`} />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Subscription Expiry</p>
                    <p className={`text-sm font-bold ${isExpiringSoon && tenant?.is_active ? "text-orange-600" : "text-green-600"
                      }`}>
                      {new Date(tenant.expiry_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    {tenant.is_active && (
                      <p className="text-xs mt-1">
                        {daysRemaining} days remaining
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}