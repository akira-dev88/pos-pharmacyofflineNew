import { IonIcon } from '@ionic/react';
import { personCircleOutline, settingsOutline, logOutOutline, notificationsOutline, closeCircleOutline, warningOutline, checkmarkCircle, menuOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { getLowStockProducts } from "../renderer/services/productApi";
import { getSettings } from "../renderer/services/settingsApi";

interface TopBarProps {
    onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [lowStockItems, setLowStockItems] = useState<any[]>([]);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [shopName, setShopName] = useState("");

    useEffect(() => {
        getSettings().then(res => {
            const s = res?.data || res;
            if (s?.shop_name) setShopName(s.shop_name);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        getLowStockProducts().then((data: any[]) => {
            const items = Array.isArray(data) ? data : [];
            setLowStockItems(items);
            setLowStockCount(items.length);
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
        <div className="flex items-center justify-between pl-4 pr-2 py-1 bg-white border border-gray-200 rounded-full w-[98%] mx-auto my-[1%]">
            <div className="flex items-center gap-4">
                {shopName && (
                    <div className="flex flex-col items-start pl-3">
                        <span className="text-gray-500 font-semibold text-xs leading-none">Hello,</span>
                        <span className="text-gray-900 font-bold text-lg tracking-tight whitespace-nowrap">{shopName}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">

                {/* Mobile Menu Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMenuClick}
                    className="md:hidden text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                >
                    <IonIcon icon={menuOutline} className="text-xl" />
                </Button>

                {/* Notifications Bell */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-full h-12 w-12 flex items-center justify-center focus-visible:ring-0 focus-visible:ring-offset-0">
                            <IonIcon icon={notificationsOutline} className="text-xl" />
                            {lowStockCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full">
                                    {lowStockCount > 99 ? '99+' : lowStockCount}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 bg-white text-black border border-gray-200 shadow-2xl p-2">
                        <DropdownMenuLabel className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                            <span className="text-sm font-semibold text-gray-900">{t('topbar.notifTitle')}</span>
                            {lowStockCount > 0 && (
                                <Badge variant="secondary" className="bg-red-500/10 text-red-600 border border-red-500/30 rounded-full px-2 py-0.5 text-xs font-medium">
                                    {lowStockCount} {lowStockCount > 1 ? t('topbar.notifAlerts') : t('topbar.notifAlert')}
                                </Badge>
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-200" />
                        <ScrollArea className="h-[320px]">
                            {lowStockItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                    <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                        <IonIcon icon={checkmarkCircle} className="text-3xl text-green-500" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">{t('topbar.notifAllGood')}</p>
                                    <p className="text-xs text-gray-500 mt-1">{t('topbar.notifAllGoodSub')}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {lowStockItems.map((item: any) => (
                                        <DropdownMenuItem
                                            key={item.product_uuid}
                                            onClick={() => navigate('/admin/products')}
                                            className="cursor-pointer p-3 hover:bg-gray-100 transition-colors focus:bg-gray-100"
                                        >
                                            <div className="flex items-start gap-3 w-full">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.stock === 0 ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                                                    <IonIcon
                                                        icon={item.stock === 0 ? closeCircleOutline : warningOutline}
                                                        className={`text-xl ${item.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                                    <p className={`text-xs mt-0.5 ${item.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                                        {item.stock === 0
                                                            ? t('topbar.notifOutOfStock')
                                                            : t('topbar.notifLowStock', { count: item.stock })}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={`flex-shrink-0 ${item.stock === 0
                                                        ? 'text-red-500 border-red-500/30 bg-red-500/10'
                                                        : 'text-amber-500 border-amber-500/30 bg-amber-500/10'}`}
                                                >
                                                    {item.stock}
                                                </Badge>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 h-auto hover:bg-gray-100 rounded-full transition-colors border border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden lg:block text-left">
                                <div className="text-sm font-semibold text-gray-800">{user?.name}</div>
                                <div className="text-xs text-gray-500 capitalize">{getRoleTranslation(user?.role)}</div>
                            </div>
                            <svg className="hidden lg:block w-4 h-4 text-gray-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-white text-black border border-gray-200 shadow-2xl p-2">
                        <DropdownMenuLabel className="px-3 py-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-200" />
                        <DropdownMenuItem
                            onClick={() => handleNavigate('/admin/profile')}
                            className="cursor-pointer gap-3 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                            <IonIcon icon={personCircleOutline} className="text-lg text-gray-500" />
                            <span>{t('topbar.yourProfile')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleNavigate('/admin/settings')}
                            className="cursor-pointer gap-3 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                            <IonIcon icon={settingsOutline} className="text-lg text-gray-500" />
                            <span>{t('topbar.settingsDropdown')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-200" />
                        <DropdownMenuItem
                            onClick={logout}
                            className="cursor-pointer gap-3 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors focus:text-red-700"
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