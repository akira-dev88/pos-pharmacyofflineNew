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
  moonOutline
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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active
          ? "bg-green-500 text-white shadow-lg"
          : "text-gray-300 hover:bg-[#212121] hover:text-white"
        }`}
    >
      <IonIcon icon={icon} className={`text-xl ${active ? "text-white" : "text-gray-400"}`} />
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
    <div className="space-y-1 font-inter">
      <div className="p-3 text-xs font-semibold text-start text-gray-500 uppercase tracking-wider">
        {title}
      </div>
      {children}
    </div>
  );
}

// ============================================
// SIDEBAR CONTENT COMPONENT — defined OUTSIDE AdminLayout
// ============================================
interface SidebarContentProps {
  user: any;
  currentPath: string;
  navigate: (path: string) => void;
  t: (key: string) => string;
}

function SidebarContent({ user, currentPath, navigate, t }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">

      {/* SIDEBAR HEADER */}
      <div className="p-4">
        <div className="text-start">
          <div className="text-lg font-bold text-white">
            {t('adminLayout.adminPanel')}
          </div>
          <div className="text-xs text-gray-400 capitalize mt-1">
            {t(`adminLayout.roles.${user.role}`)}
          </div>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">

        {user.role === "owner" && (
          <NavItem
            label={t('adminLayout.nav.dashboard')}
            path="/admin/dashboard"
            currentPath={currentPath}
            icon={home}
            onClick={() => navigate("/admin/dashboard")}
          />
        )}

        {user.role === "owner" && (
          <NavSection title={t('adminLayout.sections.business')}>
            <NavItem
              label={t('adminLayout.nav.reports')}
              path="/admin/reports"
              currentPath={currentPath}
              icon={barChartOutline}
              onClick={() => navigate("/admin/reports")}
            />
            <NavItem
              label={t('adminLayout.nav.dailyReport')}
              path="/admin/daily-report"
              currentPath={currentPath}
              icon={documentTextOutline}
              onClick={() => navigate("/admin/daily-report")}
            />
            <NavItem
              label={t('adminLayout.nav.endOfDay')}
              path="/admin/eod"
              currentPath={currentPath}
              icon={moonOutline}
              onClick={() => navigate("/admin/eod")}
            />
            <NavItem
              label={t('adminLayout.nav.gstReport')}
              path="/admin/gst-report"
              currentPath={currentPath}
              icon={documentTextOutline}
              onClick={() => navigate("/admin/gst-report")}
            />
            <NavItem
              label={t('adminLayout.nav.supplier')}
              path="/admin/supplier"
              currentPath={currentPath}
              icon={peopleCircleOutline}
              onClick={() => navigate("/admin/supplier")}
            />

            <NavItem
              label={t('adminLayout.nav.purchases')}
              path="/admin/purchases"
              currentPath={currentPath}
              icon={documentTextOutline}
              onClick={() => navigate("/admin/purchases")}
            />
            <NavItem
              label={t('adminLayout.nav.staff')}
              path="/admin/staff"
              currentPath={currentPath}
              icon={peopleCircleOutline}
              onClick={() => navigate("/admin/staff")}
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
              onClick={() => navigate("/admin/products")}
            />
            <NavItem
              label={t('adminLayout.nav.purchase')}
              path="/admin/purchase"
              currentPath={currentPath}
              icon={cartOutline}
              onClick={() => navigate("/admin/purchase")}
            />
            <NavItem
              label={t('adminLayout.nav.stock')}
              path="/admin/stock"
              currentPath={currentPath}
              icon={documentTextOutline}
              onClick={() => navigate("/admin/stock")}
            />
            <NavItem
              label={t('adminLayout.nav.sales')}
              path="/admin/sales"
              currentPath={currentPath}
              icon={documentTextOutline}
              onClick={() => navigate("/admin/sales")}
            />
            <NavItem
              label={t('adminLayout.nav.customer')}
              path="/admin/customer"
              currentPath={currentPath}
              icon={peopleOutline}
              onClick={() => navigate("/admin/customer")}
            />
          </NavSection>
        )}

        <NavSection title={t('adminLayout.sections.account')}>
          <NavItem
            label={t('adminLayout.nav.profile')}
            path="/admin/profile"
            currentPath={currentPath}
            icon={personCircleOutline}
            onClick={() => navigate("/admin/profile")}
          />
          <NavItem
            label={t('adminLayout.nav.settings')}
            path="/admin/settings"
            currentPath={currentPath}
            icon={settingsOutline}
            onClick={() => navigate("/admin/settings")}
          />
        </NavSection>
      </div>

      {/* SIDEBAR FOOTER */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={() => navigate("/pos")}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
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
    return <div className="p-4">{t('adminLayout.loadingUser')}</div>;
  }

  const currentPath = location.pathname;

  return (
    <div className="h-screen flex flex-col font-inter bg-[#222]">

      <Topbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex overflow-hidden">

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:block w-64 bg-[#222] text-white overflow-y-auto rounded-tl-2xl rounded-bl-2xl">
          <SidebarContent
            user={user}
            currentPath={currentPath}
            navigate={navigate}
            t={t}
          />
        </aside>

        {/* MOBILE SIDEBAR */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#141414] text-white z-50 md:hidden overflow-y-auto">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div className="text-lg font-bold text-blue-500">{t('adminLayout.adminPanel')}</div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <IonIcon icon={closeOutline} className="text-xl" />
                </button>
              </div>
              <SidebarContent
                user={user}
                currentPath={currentPath}
                navigate={navigate}
                t={t}
              />
            </aside>
          </>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FC] rounded-2xl rounded-br-2xl mr-2 mb-2 scrollbar-hide">
          <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}