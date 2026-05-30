import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import Topbar from "../components/Topbar";
import {
  home,
  cubeOutline,
  documentTextOutline,
  peopleOutline,
  barChartOutline,
  cartOutline,
  peopleCircleOutline,
  settingsOutline,
  personCircleOutline,
  logOutOutline,
  checkmarkCircle,
  closeOutline,
} from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import { useState } from "react";

// ============================================
// NAVIGATION ITEM COMPONENT
// ============================================
interface NavItemProps {
  label: string;
  path: string;
  currentPath: string;
  icon: string;
  onClick: () => void;
}

function NavItem({ label, path, currentPath, icon, onClick }: NavItemProps) {
  const active = currentPath === path;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
        active
          ? "bg-green-600 text-white shadow-md"
          : "text-gray-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      <IonIcon icon={icon} className={`text-xl ${active ? "text-white" : "text-gray-500"}`} />
      <span className="text-sm font-medium">{label}</span>
      {active && <IonIcon icon={checkmarkCircle} className="text-white text-sm ml-auto" />}
    </button>
  );
}

// ============================================
// NAVIGATION SECTION COMPONENT
// ============================================
interface NavSectionProps {
  title: string;
  children: React.ReactNode;
}

function NavSection({ title, children }: NavSectionProps) {
  return (
    <div className="space-y-1">
      <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </div>
      {children}
    </div>
  );
}

// ============================================
// SIDEBAR CONTENT COMPONENT
// ============================================
interface SidebarContentProps {
  user: any;
  currentPath: string;
  navigate: (path: string) => void;
  t: (key: string) => string;
  onMobileClose?: () => void;
}

function SidebarContent({ user, currentPath, navigate, t, onMobileClose }: SidebarContentProps) {
  const handleNavigate = (path: string) => {
    navigate(path);
    onMobileClose?.();
  };

  return (
    <div className="flex flex-col h-full text-start">
      {/* Sidebar Header */}
      <div className="p-4">
        <div className="text-start">
          <div className="text-lg font-bold text-white tracking-tight">
            {t('adminLayout.adminPanel')}
          </div>
          <div className="text-xs text-gray-400 capitalize mt-0.5">
            {t(`adminLayout.roles.${user.role}`)}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
        {user.role === "owner" && (
          <NavItem
            label={t('adminLayout.nav.dashboard')}
            path="/admin/dashboard"
            currentPath={currentPath}
            icon={home}
            onClick={() => handleNavigate("/admin/dashboard")}
          />
        )}

        {user.role === "owner" && (
          <NavSection title={t('adminLayout.sections.business')}>
            <NavItem
              label={t('adminLayout.nav.reports')}
              path="/admin/reports"
              currentPath={currentPath}
              icon={barChartOutline}
              onClick={() => handleNavigate("/admin/reports")}
            />
            <NavItem
              label={t('adminLayout.nav.dailyReport')}
              path="/admin/daily-report"
              currentPath={currentPath}
              icon={documentTextOutline}
              onClick={() => handleNavigate("/admin/daily-report")}
            />
            <NavItem
              label={t('adminLayout.nav.gstReport')}
              path="/admin/gst-report"
              currentPath={currentPath}
              icon={documentTextOutline}
              onClick={() => handleNavigate("/admin/gst-report")}
            />
            <NavItem
              label={t('adminLayout.nav.supplier')}
              path="/admin/supplier"
              currentPath={currentPath}
              icon={peopleCircleOutline}
              onClick={() => handleNavigate("/admin/supplier")}
            />
            <NavItem
              label={t('adminLayout.nav.purchases')}
              path="/admin/purchases"
              currentPath={currentPath}
              icon={documentTextOutline}
              onClick={() => handleNavigate("/admin/purchases")}
            />
            <NavItem
              label={t('adminLayout.nav.staff')}
              path="/admin/staff"
              currentPath={currentPath}
              icon={peopleCircleOutline}
              onClick={() => handleNavigate("/admin/staff")}
            />
          </NavSection>
        )}

        {["owner", "manager"].includes(user.role) && (
          <NavSection title={t('adminLayout.sections.management')}>
            <NavItem
              label={t('adminLayout.nav.products')}
              path="/admin/products"
              currentPath={currentPath}
              icon={cubeOutline}
              onClick={() => handleNavigate("/admin/products")}
            />
            <NavItem
              label={t('adminLayout.nav.purchase')}
              path="/admin/purchase"
              currentPath={currentPath}
              icon={cartOutline}
              onClick={() => handleNavigate("/admin/purchase")}
            />
            <NavItem
              label={t('adminLayout.nav.stock')}
              path="/admin/stock"
              currentPath={currentPath}
              icon={documentTextOutline}
              onClick={() => handleNavigate("/admin/stock")}
            />
            <NavItem
              label={t('adminLayout.nav.sales')}
              path="/admin/sales"
              currentPath={currentPath}
              icon={documentTextOutline}
              onClick={() => handleNavigate("/admin/sales")}
            />
            <NavItem
              label={t('adminLayout.nav.customer')}
              path="/admin/customer"
              currentPath={currentPath}
              icon={peopleOutline}
              onClick={() => handleNavigate("/admin/customer")}
            />
          </NavSection>
        )}

        <NavSection title={t('adminLayout.sections.account')}>
          <NavItem
            label={t('adminLayout.nav.profile')}
            path="/admin/profile"
            currentPath={currentPath}
            icon={personCircleOutline}
            onClick={() => handleNavigate("/admin/profile")}
          />
          <NavItem
            label={t('adminLayout.nav.settings')}
            path="/admin/settings"
            currentPath={currentPath}
            icon={settingsOutline}
            onClick={() => handleNavigate("/admin/settings")}
          />
        </NavSection>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-gray-800 mt-auto">
        <div className="flex items-center gap-2 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-semibold">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user.role}</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/pos")}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
        >
          <IonIcon icon={logOutOutline} className="text-lg" />
          <span>{t('adminLayout.goToPos')}</span>
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN ADMIN LAYOUT COMPONENT
// ============================================
export default function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F9FC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const currentPath = location.pathname;

  return (
    <div className="h-screen flex flex-col bg-[#141414]">
      <Topbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 flex-col bg-[#1a1a1a] text-white shadow-xl overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
          <SidebarContent user={user} currentPath={currentPath} navigate={navigate} t={t} />
        </aside>

        {/* Mobile Sidebar (with slide animation) */}
        <div
          className={`fixed inset-0 z-50 transition-all duration-300 ${
            mobileMenuOpen ? "visible" : "invisible"
          }`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
              mobileMenuOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar panel */}
          <aside
            className={`absolute left-0 top-0 bottom-0 w-64 bg-[#1a1a1a] text-white shadow-2xl transition-transform duration-300 ease-out ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex justify-end p-2 border-b border-gray-800">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <IonIcon icon={closeOutline} className="text-2xl" />
              </button>
            </div>
            <SidebarContent
              user={user}
              currentPath={currentPath}
              navigate={navigate}
              t={t}
              onMobileClose={() => setMobileMenuOpen(false)}
            />
          </aside>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FC] rounded-tl-2xl rounded-bl-2xl shadow-inner">
          <div className="flex-1 overflow-y-auto p-1 scrollbar-thin scrollbar-track-slate-200 scrollbar-thumb-slate-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}