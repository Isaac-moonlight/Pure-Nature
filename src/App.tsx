/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Flame,
  Search,
  BellRing,
  ShoppingBag,
  Sparkles,
  QrCode,
  MapPin,
  CheckCircle2,
  Clock,
  Leaf,
  ChevronRight,
  UtensilsCrossed,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Header } from './components/Header';
import { MenuItemCard } from './components/MenuItemCard';
import { ItemDetailModal } from './components/ItemDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { TableSelectorModal } from './components/TableSelectorModal';
import { TableEntryGateModal } from './components/TableEntryGateModal';
import { WaiterCallModal } from './components/WaiterCallModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { KitchenDashboard } from './components/KitchenDashboard';
import { KitchenPinModal } from './components/KitchenPinModal';
import { RestaurantFooter } from './components/RestaurantFooter';
import {
  RESTAURANT_INFO,
  MENU_CATEGORIES,
  MENU_ITEMS,
  formatPrice
} from './data/restaurantData';
import { MenuItem, CartItem, Order, WaiterCall } from './types';
import {
  subscribeToAllOrders,
  subscribeToWaiterCalls
} from './lib/firebase';
import { playOrderBell, playWaiterCallChime, playStatusUpdateSound } from './utils/audio';

export default function App() {
  // Table state (detection from URL ?table= or ?t= or localStorage)
  const [currentTable, setCurrentTable] = useState<number>(4);
  const [isTableGateOpen, setIsTableGateOpen] = useState(false);
  const [qrCodeDetectedBanner, setQrCodeDetectedBanner] = useState<string | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('pn_cart_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal states
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isStaffOpen, setIsStaffOpen] = useState(false);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Firestore real-time state
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const previousOrdersCount = useRef<number | null>(null);
  const previousCallsCount = useRef<number | null>(null);

  // Category and Search filters
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<'all' | 'special' | 'vegetarian' | 'spicy'>('all');

  // Mandatory Table Gate Check on first arrival or URL parameter
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table') || urlParams.get('t');

    if (tableParam) {
      const parsedNum = parseInt(tableParam, 10);
      if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= RESTAURANT_INFO.tablesCount) {
        setCurrentTable(parsedNum);
        localStorage.setItem('pn_current_table', parsedNum.toString());
        localStorage.setItem('pn_table_verified', 'true');
        setQrCodeDetectedBanner(`Table ${parsedNum} assignée automatiquement via votre QR Code`);
        setTimeout(() => setQrCodeDetectedBanner(null), 4000);
        return;
      }
    }

    // Check localStorage
    const savedTable = localStorage.getItem('pn_current_table');
    const isVerified = localStorage.getItem('pn_table_verified');

    if (savedTable && isVerified === 'true') {
      const num = parseInt(savedTable, 10);
      if (!isNaN(num) && num >= 1 && num <= RESTAURANT_INFO.tablesCount) {
        setCurrentTable(num);
        return;
      }
    }

    // If not verified, force open table gate modal!
    setIsTableGateOpen(true);
  }, []);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('pn_cart_v2', JSON.stringify(cart));
    } catch {
      // safe
    }
  }, [cart]);

  // Handle table switch from header selector
  const handleSelectTable = (tableNum: number) => {
    setCurrentTable(tableNum);
    localStorage.setItem('pn_current_table', tableNum.toString());
    localStorage.setItem('pn_table_verified', 'true');
  };

  // Handle initial Gate Confirmation
  const handleConfirmGateTable = (tableNum: number) => {
    setCurrentTable(tableNum);
    localStorage.setItem('pn_current_table', tableNum.toString());
    localStorage.setItem('pn_table_verified', 'true');
    setIsTableGateOpen(false);
    playOrderBell();
  };

  // Real-time Subscriptions (Firestore + Multi-tab sync)
  useEffect(() => {
    const unsubscribeOrders = subscribeToAllOrders((orders) => {
      if (previousOrdersCount.current !== null && orders.length > previousOrdersCount.current) {
        if (soundEnabled) {
          playOrderBell();
        }
      }
      previousOrdersCount.current = orders.length;
      setAllOrders(orders);
    });

    const unsubscribeCalls = subscribeToWaiterCalls((calls) => {
      const pendingCount = calls.filter((c) => c.status === 'pending').length;
      if (previousCallsCount.current !== null && pendingCount > previousCallsCount.current) {
        if (soundEnabled) {
          playWaiterCallChime();
        }
      }
      previousCallsCount.current = pendingCount;
      setWaiterCalls(calls);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeCalls();
    };
  }, [soundEnabled]);

  // Cart operations
  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (ci) =>
          ci.menuItem.id === item.menuItem.id &&
          ci.selectedSize?.id === item.selectedSize?.id &&
          ci.specialInstructions === item.specialInstructions &&
          JSON.stringify(ci.selectedSupplements.map((s) => s.id).sort()) ===
            JSON.stringify(item.selectedSupplements.map((s) => s.id).sort())
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const current = updated[existingIndex];
        const newQty = current.quantity + item.quantity;
        updated[existingIndex] = {
          ...current,
          quantity: newQty,
          totalPrice: current.unitPrice * newQty,
        };
        return updated;
      }
      return [item, ...prev];
    });
  };

  const handleQuickAdd = (menuItem: MenuItem) => {
    const cartItem: CartItem = {
      cartItemId: 'ITEM-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      menuItem,
      quantity: 1,
      selectedSupplements: [],
      specialInstructions: '',
      unitPrice: menuItem.price,
      totalPrice: menuItem.price,
    };
    handleAddToCart(cartItem);
    playOrderBell();
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOrderSuccess = (orderId: string) => {
    setIsCartOpen(false);
    setIsTrackingModalOpen(true);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalPrice = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  // Active table orders
  const tableActiveOrders = useMemo(() => {
    return allOrders.filter(
      (o) => Number(o.tableNumber) === Number(currentTable) && o.status !== 'cancelled'
    );
  }, [allOrders, currentTable]);

  // Search normalizer: strips accents, punctuation, and handles french diacritics
  const normalizeSearchText = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’']/g, ' ')
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    const hasSearch = trimmedQuery.length > 0;

    return MENU_ITEMS.filter((item) => {
      // Dietary tag filters
      if (tagFilter === 'special' && !item.isChefSpecial) return false;
      if (tagFilter === 'vegetarian' && !item.isVegetarian) return false;
      if (tagFilter === 'spicy' && !item.spicyLevel) return false;

      // When actively searching, search across the entire menu regardless of category
      if (hasSearch) {
        const normQuery = normalizeSearchText(trimmedQuery);
        const searchTokens = normQuery.split(' ').filter(Boolean);

        // Find category label for matching
        const catObj = MENU_CATEGORIES.find((c) => c.id === item.category);
        const catLabel = catObj ? catObj.label : '';

        const targetData = normalizeSearchText(
          `${item.name} ${item.description} ${item.ingredients} ${(item.tags || []).join(' ')} ${catLabel}`
        );

        // All search words must be matched
        return searchTokens.every((token) => targetData.includes(token));
      }

      // When not searching, filter by active category
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }

      return true;
    });
  }, [activeCategory, tagFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Header with Table selection and hidden PIN trigger */}
      <Header
        currentTable={currentTable}
        onOpenTableModal={() => setIsTableModalOpen(true)}
        onOpenWaiterModal={() => setIsWaiterModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracking={() => setIsTrackingModalOpen(true)}
        onTriggerPinModal={() => setIsPinModalOpen(true)}
        cartCount={cartItemCount}
        cartTotal={cartTotalPrice}
        tableActiveOrders={tableActiveOrders}
      />

      {/* Auto QR Code Banner */}
      {qrCodeDetectedBanner && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-center text-xs sm:text-sm text-emerald-800 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{qrCodeDetectedBanner}</span>
        </div>
      )}

      {/* Clean, Uncluttered First Section (Menu & Essential Infos on Solid White) */}
      <section className="bg-white border-b border-gray-200 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
            {/* Left Content */}
            <div className="max-w-xl space-y-3.5 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Naturel & Fraîcheur du Marché</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Menu <span className="text-emerald-700">Pure Nature</span>
              </h1>

              {/* Minimal concise restaurant info */}
              <div className="text-xs sm:text-sm text-gray-600 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1.5 pt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Boulevard de la Marina, Cotonou
                </span>
                <span className="text-gray-300 hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Ouvert 11h30 - 23h30
                </span>
                <span className="text-gray-300 hidden sm:inline">•</span>
                <span className="text-emerald-700 font-medium">Service terrasse en continu</span>
              </div>

              {/* Table assignment button badge */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(true)}
                  className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 transition-colors flex items-center gap-2 group shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Commande pour la :</span>
                  <span className="font-mono font-bold text-emerald-700 group-hover:underline">
                    Table {currentTable}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsWaiterModalOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <BellRing className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Appeler le serveur</span>
                </button>
              </div>
            </div>

            {/* Right Visual Frame */}
            <div className="relative shrink-0 w-64 h-64 sm:w-72 sm:h-72">
              <div className="w-full h-full rounded-full p-2 bg-white border-2 border-emerald-600 shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80"
                  alt="Plats frais Pure Nature"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              {/* Solid Micro-badge without opacity */}
              <div className="absolute -bottom-2 -left-2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-[11px] font-mono text-gray-800 shadow-md flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Grillades braisées au feu de bois</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Menu Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6 bg-white">
        {/* Search & Dietary Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher un plat, poisson, jus frais (ex: capitaine, alloco, bissap)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-gray-300 focus:border-emerald-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-colors shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-900"
                >
                  Effacer
                </button>
              )}
            </div>

            {/* Quick Dietary Tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setTagFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                  tagFilter === 'all'
                    ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Tous les mets
              </button>
              <button
                onClick={() => setTagFilter('special')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap flex items-center gap-1 ${
                  tagFilter === 'special'
                    ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Signatures du Chef
              </button>
              <button
                onClick={() => setTagFilter('vegetarian')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap flex items-center gap-1 ${
                  tagFilter === 'vegetarian'
                    ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Leaf className="w-3 h-3 text-emerald-600" />
                Végétarien
              </button>
              <button
                onClick={() => setTagFilter('spicy')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap flex items-center gap-1 ${
                  tagFilter === 'spicy'
                    ? 'bg-red-700 border-red-700 text-white shadow-xs'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Flame className="w-3 h-3 text-orange-500" />
                Pimenté
              </button>
            </div>
          </div>

          {/* Clean Category Navigation Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap text-xs sm:text-sm font-semibold border ${
                activeCategory === 'all'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Toute la Carte
            </button>

            {MENU_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap text-xs sm:text-sm font-semibold border ${
                    isActive
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Active Search Results Banner */}
          {searchQuery.trim() && (
            <div className="bg-emerald-50 border border-emerald-300 px-4 py-2 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-xs">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-700" />
                <span>
                  Résultats pour « <strong className="font-bold text-gray-900">{searchQuery}</strong> » : {filteredMenuItems.length} mets trouvé{filteredMenuItems.length > 1 ? 's' : ''} sur toute la carte
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold text-xs transition-colors"
              >
                Tout réafficher
              </button>
            </div>
          )}
        </div>

        {/* Menu Items Grid */}
        {filteredMenuItems.length === 0 ? (
          <div className="py-16 text-center text-gray-500 space-y-3 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="font-serif text-xl text-gray-800">Aucun plat ne correspond à vos critères</p>
            <p className="text-xs max-w-sm mx-auto text-gray-500">
              Essayez de réinitialiser la recherche ou de sélectionner une autre catégorie.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
                setTagFilter('all');
              }}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-sm text-white font-semibold rounded-xl transition-colors shadow-xs"
            >
              Afficher toute la carte
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredMenuItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onOpenDetails={(selected) => {
                  setSelectedMenuItem(selected);
                  setIsDetailModalOpen(true);
                }}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Action Bar on Mobile */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-lg flex items-center justify-between border border-emerald-600 active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-white text-emerald-900 text-xs font-bold flex items-center justify-center">
                {cartItemCount}
              </span>
              <span className="text-sm font-bold">Voir mon Panier</span>
            </div>
            <span className="font-mono font-bold text-base">
              {formatPrice(cartTotalPrice)}
            </span>
          </button>
        </div>
      )}

      {/* Footer */}
      <RestaurantFooter onOpenStaff={() => setIsPinModalOpen(true)} />

      {/* Mandatory Table Number Gate at Entry */}
      <TableEntryGateModal
        isOpen={isTableGateOpen}
        selectedTable={currentTable}
        onConfirm={handleConfirmGateTable}
      />

      {/* Modals */}
      <ItemDetailModal
        item={selectedMenuItem}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMenuItem(null);
        }}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        currentTable={currentTable}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
      />

      <TableSelectorModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        currentTable={currentTable}
        onSelectTable={handleSelectTable}
      />

      <WaiterCallModal
        isOpen={isWaiterModalOpen}
        onClose={() => setIsWaiterModalOpen(false)}
        tableNumber={currentTable}
      />

      <OrderTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        orders={allOrders}
        currentTable={currentTable}
        onOpenWaiterCall={() => setIsWaiterModalOpen(true)}
      />

      {/* Security PIN Modal (Only accessed via 3 clicks on logo) */}
      <KitchenPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsStaffOpen(true);
          playOrderBell();
        }}
      />

      {/* Kitchen & Service Real-Time Console */}
      <KitchenDashboard
        isOpen={isStaffOpen}
        onClose={() => setIsStaffOpen(false)}
        orders={allOrders}
        waiterCalls={waiterCalls}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />
    </div>
  );
}
