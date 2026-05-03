import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkmarkCircle, exit, barbellOutline, personCircleOutline, settingsOutline, logOutOutline, notifications, notificationsOutline, menuOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import { useState, useRef, useEffect } from "react";
import { getSettings } from "../renderer/services/settingsApi";

interface TopbarProps {
    onMenuClick?: () => void;
}

function getPageTitle(path: string) {
    if (path.includes("/dashboard")) return "Dashboard";
    if (path.includes("/products")) return "Products";
    if (path.includes("/stock")) return "Stock";
    if (path.includes("/sales")) return "Sales";
    if (path.includes("/reports")) return "Reports";
    if (path.includes("/staff")) return "Staff";
    if (path.includes("/settings")) return "Settings";
    if (path.includes("/customer")) return "Customer";
    if (path.includes("/supplier")) return "Supplier";
    if (path.includes("/purchase")) return "Purchase";
    if (path.includes("/profile")) return "Profile";
    return "Admin";
}

export default function Topbar({ onMenuClick }: TopbarProps) {
    const location = useLocation();
    const navigate = useNavigate(); 
    const { user, logout } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const title = getPageTitle(location.pathname);
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDate = new Date().toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

    const [shopName, setShopName] = useState<string>("My Shop");

    useEffect(() => {
        getSettings().then(res => {
            const name = res?.data?.shop_name || res?.shop_name;
            if (name) setShopName(name);
        });
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                showUserMenu &&
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setShowUserMenu(false);
            }
        };

        // Prevent scroll when dropdown is open
        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    // Handle navigation without page scroll reset
    const handleNavigation = (path: string) => {
        setShowUserMenu(false);
        navigate(path);
    };

    // Prevent event bubbling
    const handleMenuClick = (e: React.MouseEvent, callback: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        callback();
    };

    return (
        <div className="bg-[#222] px-6 flex items-center justify-between shadow-sm sticky top-0 z-30">
            {/* LEFT - Page Title & Breadcrumb */}
            <div className="flex items-center gap-3">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                >
                    <IonIcon icon={menuOutline} className="text-xl" />
                </button>

                <div className="grid">
                    <h1 className="text-2xl font-bold text-white">
                        {shopName}
                    </h1>
                </div>
            </div>

            {/* RIGHT - User & Actions */}
            <div className="flex items-center gap-3">

                {/* Date & Time */}
                <div className="hidden md:flex flex-col items-end bg-[#212121] hover:bg-white px-4 py-1 rounded-full">
                    <div className="text-sm font-semibold text-gray-500">{currentTime}</div>
                    <div className="text-xs text-gray-400">{currentDate}</div>
                </div>

                {/* Notification Bell */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Handle notification click
                    }}
                    className="relative px-3 py-2 bg-[#333333] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                >
                    <IonIcon icon={notificationsOutline} className="text-xl top-0.5 relative" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative">
                    <button
                        ref={buttonRef}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowUserMenu(!showUserMenu);
                        }}
                        className="flex items-center gap-3 focus:outline-none group"
                    >
                        {/* User Avatar */}
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center rounded-full shadow-md">
                                <span className="text-sm font-semibold">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>

                        {/* User Info */}
                        <div className="hidden lg:flex justify-center items-center gap-4 py-1 px-3 rounded-full text-left bg-[#212121]">
                            <div>
                                <div className="text-sm font-semibold text-gray-500">{user?.name}</div>
                                <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                            </div>

                            {/* Dropdown Arrow */}
                            <div className="bg-white p-2 rounded-full">
                                <svg className={`hidden lg:block w-4 h-4 text-[#141414] transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                        <div
                            ref={menuRef}
                            className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                            style={{ position: 'absolute', top: '100%', right: 0 }}
                        >
                            {/* User Info Header */}
                            <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
                                <div className="text-sm font-semibold text-gray-800">{user?.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{user?.email}</div>
                                <div className="inline-block mt-1.5 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full capitalize">
                                    {user?.role}
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="py-1">
                                <button
                                    onClick={(e) => handleMenuClick(e, () => handleNavigation("/profile"))}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition"
                                >
                                    <IonIcon icon={personCircleOutline} className="text-lg text-gray-400" />
                                    <span>Your Profile</span>
                                </button>
                                <button
                                    onClick={(e) => handleMenuClick(e, () => handleNavigation("/settings"))}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition"
                                >
                                    <IonIcon icon={settingsOutline} className="text-lg text-gray-400" />
                                    <span>Settings</span>
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100"></div>

                            {/* Logout */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowUserMenu(false);
                                    logout();
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition"
                            >
                                <IonIcon icon={logOutOutline} className="text-lg text-red-500" />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}