import React, { useState } from 'react';
import {
  BellRing,
  ShoppingBag,
  Clock,
  ChevronDown,
  PhoneCall,
  UtensilsCrossed
} from 'lucide-react';
import { RESTAURANT_INFO, formatPrice } from '../data/restaurantData';
import { Order } from '../types';

interface HeaderProps {
  currentTable: number;
  onOpenTableModal: () => void;
  onOpenWaiterModal: () => void;
  onOpenCart: () => void;
  onOpenTracking: () => void;
  onTriggerPinModal: () => void;
  cartCount: number;
  cartTotal: number;
  tableActiveOrders: Order[];
}

export const Header: React.FC<HeaderProps> = ({
  currentTable,
  onOpenTableModal,
  onOpenWaiterModal,
  onOpenCart,
  onOpenTracking,
  onTriggerPinModal,
  cartCount,
  cartTotal,
  tableActiveOrders,
}) => {
  const [logoClicks, setLogoClicks] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

  // Triple-click on logo is the ONLY hidden trigger for staff PIN modal
  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);

    if (clickTimer) clearTimeout(clickTimer);

    if (newCount >= 3) {
      setLogoClicks(0);
      onTriggerPinModal();
    } else {
      const timer = setTimeout(() => {
        setLogoClicks(0);
      }, 700);
      setClickTimer(timer);
    }
  };

  const hasActiveOrders = tableActiveOrders.some(
    (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  );

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 transition-all shadow-xs">
      {/* Top Banner */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-1.5 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-emerald-800">En direct de la terrasse</span>
          <span className="hidden sm:inline text-gray-500">• {RESTAURANT_INFO.neighborhood}, Cotonou</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`tel:${RESTAURANT_INFO.phone}`}
            className="flex items-center gap-1.5 text-gray-700 hover:text-emerald-700 transition-colors font-medium"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-mono text-[11px]">{RESTAURANT_INFO.phoneDisplay}</span>
          </a>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Brand & Logo (Exclusive triple-click target) */}
        <div className="flex items-center gap-3">
          <div
            onClick={handleLogoClick}
            className="cursor-pointer select-none group flex items-center gap-3 active:scale-95 transition-transform"
            title="Pure Nature Bénin"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-700 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-emerald-800 transition-colors">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-gray-900 group-hover:text-emerald-700 transition-colors">
                  Pure Nature
                </span>
                <span className="text-[10px] uppercase tracking-wider font-mono font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  Bénin
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden xs:block truncate">
                Cuisine 100% Naturelle & Grillades
              </p>
            </div>
          </div>
        </div>

        {/* Right Navigation & Quick Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Table Selector */}
          <button
            onClick={onOpenTableModal}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-800 transition-all hover:border-emerald-600 group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium">
              Table <span className="font-mono font-bold text-emerald-700">{currentTable}</span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition-colors" />
          </button>

          {/* Waiter Call Button */}
          <button
            onClick={onOpenWaiterModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95"
            title="Appeler un serveur à votre table"
          >
            <BellRing className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Serveur</span>
          </button>

          {/* Active Order Tracker Button */}
          {hasActiveOrders && (
            <button
              onClick={onOpenTracking}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
              title="Suivre vos plats en direct"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Suivi</span>
              <span className="font-mono text-xs bg-emerald-900 px-1.5 py-0.5 rounded-full text-white font-bold">
                {tableActiveOrders.filter((o) => o.status !== 'served' && o.status !== 'cancelled').length}
              </span>
            </button>
          )}

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-sm"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
            <span className="font-mono text-xs sm:text-sm font-bold">
              {cartCount > 0 ? formatPrice(cartTotal) : 'Panier'}
            </span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
