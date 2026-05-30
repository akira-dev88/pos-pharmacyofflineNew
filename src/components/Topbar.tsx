import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { getSettings } from "../renderer/services/settingsApi";
import { getStock } from "../renderer/services/stockApi";
import { IonIcon } from "@ionic/react";
import {
    menuOutline,
    personCircleOutline,
    settingsOutline,
    logOutOutline,
    notificationsOutline,
    closeCircleOutline,
    warningOutline,
    checkmarkCircle,
} from "ionicons/icons";

// shadcn/ui components
import { Button } from "../../@/components/ui/button";
import { Avatar, AvatarFallback } from "../../@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../@/components/ui/dropdown-menu";
import { Badge } from "../../@/components/ui/badge";
import { ScrollArea } from "../../@/components/ui/scroll-area";

interface TopbarProps {
    onMenuClick?: () => void;
}

function getPageTitle(path: string, t: (key: string) => string) {
    if (path.includes("/dashboard")) return t('topbar.pageTitles.dashboard');
    if (path.includes("/products")) return t('topbar.pageTitles.products');
    if (path.includes("/stock")) return t('topbar.pageTitles.stock');
    if (path.includes("/sales")) return t('topbar.pageTitles.sales');
    if (path.includes("/reports")) return t('topbar.pageTitles.reports');
    if (path.includes("/staff")) return t('topbar.pageTitles.staff');
    if (path.includes("/settings")) return t('topbar.pageTitles.settings');
    if (path.includes("/customer")) return t('topbar.pageTitles.customer');
    if (path.includes("/supplier")) return t('topbar.pageTitles.supplier');
    if (path.includes("/purchase")) return t('topbar.pageTitles.purchase');
    if (path.includes("/profile")) return t('topbar.pageTitles.profile');
    return t('topbar.pageTitles.admin');
}

export default function Topbar({ onMenuClick }: TopbarProps) {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [shopName, setShopName] = useState<string>(t('topbar.myShopFallback'));
    const [lowStockItems, setLowStockItems] = useState<any[]>([]);
    const [lowStockCount, setLowStockCount] = useState(0);

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDate = new Date().toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

    useEffect(() => {
        getSettings().then(res => {
            const name = res?.data?.shop_name || res?.shop_name;
            if (name) setShopName(name);
        });
    }, [t]);

    useEffect(() => {
        getStock().then((data: any[]) => {
            const low = Array.isArray(data) ? data.filter(item => item && item.stock < 10) : [];
            setLowStockItems(low);
            setLowStockCount(low.length);
        }).catch(() => {
            setLowStockItems([]);
            setLowStockCount(0);
        });
    }, []);

    const getRoleTranslation = (role?: string) => {
        switch (role) {
            case 'owner': return t('topbar.roles.owner');
            case 'manager': return t('topbar.roles.manager');
            case 'cashier': return t('topbar.roles.cashier');
            default: return t('topbar.roles.user');
        }
    };

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    return (
        <div className="bg-[#1a1a1a] px-4 md:px-6 py-1 flex items-center justify-between sticky top-0 z-30">
            {/* Left side – menu button + shop name */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMenuClick}
                    className="md:hidden text-gray-400 hover:text-white hover:bg-gray-800"
                >
                    <IonIcon icon={menuOutline} className="text-xl" />
                </Button>

                <div className="grid">
                    <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                        {shopName}
                    </h1>
                </div>
            </div>

            {/* Right side – date/time + notifications + user dropdown */}
            <div className="flex items-center gap-2 md:gap-4">
                {/* Date & Time (hidden on mobile, visible on md+) */}
                <div className="hidden md:flex flex-col items-end bg-gray-800/50 rounded-full px-4 py-1">
                    <span className="text-sm font-semibold text-gray-300">{currentTime}</span>
                    <span className="text-xs text-gray-500">{currentDate}</span>
                </div>

                {/* Notifications Dropdown (shadcn) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white hover:bg-gray-800">
                            <IonIcon icon={notificationsOutline} className="text-xl" />
                            {lowStockCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full">
                                    {lowStockCount > 99 ? '99+' : lowStockCount}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 bg-[#171717] border-gray-700 shadow-2xl">
                        <DropdownMenuLabel className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
                            <span className="text-sm font-semibold text-white">{t('topbar.notifTitle')}</span>
                            {lowStockCount > 0 && (
                                <Badge variant="secondary" className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 text-xs font-medium">
                                    {lowStockCount} {lowStockCount > 1 ? t('topbar.notifAlerts') : t('topbar.notifAlert')}
                                </Badge>
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <ScrollArea className="h-[320px]">
                            {lowStockItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                    <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                        <IonIcon icon={checkmarkCircle} className="text-3xl text-green-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-200">{t('topbar.notifAllGood')}</p>
                                    <p className="text-xs text-gray-500 mt-1">{t('topbar.notifAllGoodSub')}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-800">
                                    {lowStockItems.map((item) => (
                                        <DropdownMenuItem
                                            key={item.product_uuid}
                                            className="cursor-pointer p-3 hover:bg-gray-800/50 transition-colors focus:bg-gray-800"
                                        >
                                            <div className="flex items-start gap-3 w-full">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.stock === 0 ? 'bg-red-500/20' : 'bg-amber-500/20'
                                                    }`}>
                                                    <IonIcon
                                                        icon={item.stock === 0 ? closeCircleOutline : warningOutline}
                                                        className={`text-xl ${item.stock === 0 ? 'text-red-400' : 'text-amber-400'}`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-200 truncate">{item.name}</p>
                                                    <p className={`text-xs mt-0.5 ${item.stock === 0 ? 'text-red-400' : 'text-amber-400'
                                                        }`}>
                                                        {item.stock === 0
                                                            ? t('topbar.notifOutOfStock')
                                                            : t('topbar.notifLowStock', { count: item.stock })}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`flex-shrink-0 ${item.stock === 0
                                                        ? 'text-red-400 border-red-500/30 bg-red-500/10'
                                                        : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                                                        }`}
                                                >
                                                    {item.stock} left
                                                </Badge>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                        {lowStockItems.length > 0 && (
                            <>
                                <DropdownMenuSeparator className="bg-gray-700" />
                                <DropdownMenuItem
                                    className="cursor-pointer justify-center py-3 text-blue-400 hover:text-blue-300 font-medium hover:bg-gray-800 transition-colors"
                                    onClick={() => handleNavigate('/admin/stock')}
                                >
                                    <span>{t('topbar.notifViewAll')}</span>
                                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User Dropdown (shadcn) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 p-1 hover:bg-gray-800 rounded-full transition-colors">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden lg:block text-left">
                                <div className="text-sm font-semibold text-gray-200">{user?.name}</div>
                                <div className="text-xs text-gray-400 capitalize">{getRoleTranslation(user?.role)}</div>
                            </div>
                            <svg className="hidden lg:block w-4 h-4 text-gray-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-[#171717] border-gray-700 shadow-2xl">
                        <DropdownMenuLabel className="px-3 py-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                            onClick={() => handleNavigate('/admin/profile')}
                            className="cursor-pointer gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                        >
                            <IonIcon icon={personCircleOutline} className="text-lg text-gray-400" />
                            <span>{t('topbar.yourProfile')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleNavigate('/admin/settings')}
                            className="cursor-pointer gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                        >
                            <IonIcon icon={settingsOutline} className="text-lg text-gray-400" />
                            <span>{t('topbar.settingsDropdown')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                            onClick={logout}
                            className="cursor-pointer gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors focus:text-red-300"
                        >
                            <IonIcon icon={logOutOutline} className="text-lg" />
                            <span>{t('topbar.logout')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}