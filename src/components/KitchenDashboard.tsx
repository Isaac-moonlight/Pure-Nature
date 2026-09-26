import React, { useState } from 'react';
import {
  X,
  ChefHat,
  Volume2,
  VolumeX,
  Flame,
  CheckCircle2,
  Clock,
  Filter,
  ArrowLeft,
  BellRing,
  RotateCcw
} from 'lucide-react';
import { Order, OrderStatus, WaiterCall } from '../types';
import { RESTAURANT_INFO, formatPrice } from '../data/restaurantData';
import { updateOrderStatus, resolveWaiterCall } from '../lib/firebase';
import { playOrderBell, playWaiterCallChime } from '../utils/audio';

interface KitchenDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  waiterCalls: WaiterCall[];
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const KitchenDashboard: React.FC<KitchenDashboardProps> = ({
  isOpen,
  onClose,
  orders,
  waiterCalls,
  soundEnabled,
  onToggleSound,
}) => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'history'>('kanban');
  const [filterTable, setFilterTable] = useState<number | 'all'>('all');

  // Support ESC key to return to menu
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Active waiter calls
  const pendingCalls = waiterCalls.filter((c) => c.status === 'pending');

  // Filter orders by table if selected
  const filteredOrders = orders.filter((o) =>
    filterTable === 'all' ? true : Number(o.tableNumber) === Number(filterTable)
  );

  // Kanban groups
  const pendingOrders = filteredOrders.filter((o) => o.status === 'pending');
  const preparingOrders = filteredOrders.filter((o) => o.status === 'preparing');
  const readyOrders = filteredOrders.filter((o) => o.status === 'ready');
  const servedOrders = filteredOrders.filter((o) => o.status === 'served');

  // Revenue & Service stats
  const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalServedRevenue = servedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageTicket = nonCancelledOrders.length > 0 ? Math.round(totalRevenue / nonCancelledOrders.length) : 0;

  // Payments breakdown
  const momoTotal = nonCancelledOrders
    .filter((o) => o.paymentMethod === 'mobile_money')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const cashTableTotal = nonCancelledOrders
    .filter((o) => o.paymentMethod === 'cash_table')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const cashierTotal = nonCancelledOrders
    .filter((o) => o.paymentMethod === 'cashier')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      if (soundEnabled && (newStatus === 'ready' || newStatus === 'preparing')) {
        playOrderBell();
      }
    } catch (e) {
      console.error('Failed to change status:', e);
    }
  };

  const handleResolveCall = async (callId: string) => {
    try {
      await resolveWaiterCall(callId);
    } catch (e) {
      console.error('Failed to resolve call:', e);
    }
  };

  const getReasonLabel = (reason: WaiterCall['reason']) => {
    switch (reason) {
      case 'addition':
        return "Demande d'addition";
      case 'eau':
        return "Carafe d'eau et couverts";
      case 'service':
        return 'Commande de supplément';
      case 'question':
        return 'Assistance table';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white text-gray-900 overflow-hidden font-sans">
      {/* Top Prominent Exit & Status Banner */}
      <div className="bg-emerald-900 text-white px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 shadow-sm border-b border-emerald-950">
        {/* Prominent Button to Quit Service & Return to Menu */}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
          title="Quitter la console service et revenir au menu principal"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Quitter le service (Retour au menu)</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-200 hidden sm:inline">
              Console Service Active
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-mono transition-colors ${
              soundEnabled
                ? 'bg-emerald-800 border-emerald-600 text-emerald-100'
                : 'bg-red-900 border-red-700 text-red-200'
            }`}
            title="Activer/Désactiver les alertes sonores"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? 'Son activé' : 'Muet'}</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base sm:text-lg font-bold tracking-tight text-gray-900">
                Console Cuisine & Salle
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded font-bold uppercase">
                En Direct
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Pure Nature Bénin • Boulevard de la Marina, Cotonou
            </p>
          </div>
        </div>

        {/* Tab Selector & Close Icon */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex border border-gray-300 bg-gray-50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'kanban'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Commandes ({pendingOrders.length + preparingOrders.length + readyOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bilan de service
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            title="Quitter la console et retourner au menu"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour Menu</span>
          </button>
        </div>
      </div>

      {/* Real-time Waiter Alert Banner */}
      {pendingCalls.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-sm text-amber-900">
            <BellRing className="w-4 h-4 text-amber-700" />
            <span className="font-bold">
              {pendingCalls.length} appel{pendingCalls.length > 1 ? 's' : ''} serveur en attente :
            </span>
            <div className="flex flex-wrap gap-2">
              {pendingCalls.map((call) => (
                <div
                  key={call.id}
                  className="bg-white border border-amber-300 px-2.5 py-0.5 rounded-lg text-xs flex items-center gap-2 shadow-xs"
                >
                  <span className="font-mono font-bold text-amber-900">Table {call.tableNumber}</span>
                  <span className="text-gray-700">• {getReasonLabel(call.reason)}</span>
                  {call.notes && <span className="italic text-gray-600">"{call.notes}"</span>}
                  <button
                    onClick={() => handleResolveCall(call.id)}
                    className="ml-1 px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold"
                  >
                    Traité
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 overflow-hidden p-3 sm:p-5 flex flex-col bg-gray-50">
        {/* Filter bar */}
        <div className="mb-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600 font-mono uppercase font-semibold">Filtrer par table :</span>
            <select
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-emerald-600 font-mono shadow-xs"
            >
              <option value="all">Toutes les tables (1-25)</option>
              {Array.from({ length: RESTAURANT_INFO.tablesCount }, (_, i) => i + 1).map((t) => (
                <option key={t} value={t}>
                  Table {t}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-gray-600 font-mono">
            {filteredOrders.length} commande(s) au total
          </div>
        </div>

        {activeTab === 'kanban' ? (
          /* 3 COLUMNS KANBAN */
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
            {/* Column 1: À PRÉPARER (Pending) */}
            <div className="bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-xs">
              <div className="p-3.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <h3 className="font-serif font-bold text-sm sm:text-base text-gray-900">
                    1. À Préparer
                  </h3>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-bold">
                  {pendingOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
                {pendingOrders.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs">
                    Aucune commande en attente
                  </div>
                ) : (
                  pendingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      nextActionLabel="Lancer en cuisine"
                      onNextAction={() => handleStatusChange(order.id, 'preparing')}
                      onCancel={() => handleStatusChange(order.id, 'cancelled')}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Column 2: EN CUISSON (Preparing) */}
            <div className="bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-xs">
              <div className="p-3.5 bg-orange-50 border-b border-orange-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-600" />
                  <h3 className="font-serif font-bold text-sm sm:text-base text-gray-900">
                    2. En Cuisson
                  </h3>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 bg-orange-100 text-orange-900 border border-orange-300 rounded-full font-bold">
                  {preparingOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
                {preparingOrders.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs">
                    Aucune commande en cuisson actuellement
                  </div>
                ) : (
                  preparingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      nextActionLabel="Marquer prête au passe"
                      onNextAction={() => handleStatusChange(order.id, 'ready')}
                      onCancel={() => handleStatusChange(order.id, 'cancelled')}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Column 3: PRÊTES À SERVIR (Ready) */}
            <div className="bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-xs">
              <div className="p-3.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-serif font-bold text-sm sm:text-base text-gray-900">
                    3. Prêtes à Servir
                  </h3>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-bold">
                  {readyOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
                {readyOrders.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs">
                    Aucun plat en attente de service à table
                  </div>
                ) : (
                  readyOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      nextActionLabel="Marquer servie à table"
                      onNextAction={() => handleStatusChange(order.id, 'served')}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: BILAN & REVENUE DU SERVICE */
          <div className="flex-1 overflow-y-auto space-y-5">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
                <span className="text-xs text-gray-500 font-mono uppercase font-semibold block mb-1">
                  Chiffre d'affaires total
                </span>
                <span className="font-mono text-2xl font-bold text-emerald-700">
                  {formatPrice(totalRevenue)}
                </span>
                <span className="text-[11px] text-gray-500 block mt-1">
                  Sur {nonCancelledOrders.length} commandes enregistrées
                </span>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
                <span className="text-xs text-gray-500 font-mono uppercase font-semibold block mb-1">
                  Total déjà servi
                </span>
                <span className="font-mono text-2xl font-bold text-gray-900">
                  {formatPrice(totalServedRevenue)}
                </span>
                <span className="text-[11px] text-gray-500 block mt-1">
                  {servedOrders.length} commandes clôturées
                </span>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
                <span className="text-xs text-gray-500 font-mono uppercase font-semibold block mb-1">
                  Panier moyen
                </span>
                <span className="font-mono text-2xl font-bold text-gray-900">
                  {formatPrice(averageTicket)}
                </span>
                <span className="text-[11px] text-gray-500 block mt-1">
                  Par table / commande
                </span>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
                <span className="text-xs text-gray-500 font-mono uppercase font-semibold block mb-1">
                  En cours cuisine / passe
                </span>
                <span className="font-mono text-2xl font-bold text-amber-700">
                  {pendingOrders.length + preparingOrders.length + readyOrders.length}
                </span>
                <span className="text-[11px] text-gray-500 block mt-1">
                  Commandes actives
                </span>
              </div>
            </div>

            {/* Payments breakdown */}
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
              <h4 className="font-serif font-bold text-base mb-3 text-gray-900">
                Ventilation par mode de règlement
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <span className="text-gray-600 block font-mono font-semibold">Mobile Money (MTN / Moov)</span>
                  <span className="font-mono text-lg font-bold text-amber-700">
                    {formatPrice(momoTotal)}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <span className="text-gray-600 block font-mono font-semibold">Espèces au serveur à table</span>
                  <span className="font-mono text-lg font-bold text-emerald-700">
                    {formatPrice(cashTableTotal)}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <span className="text-gray-600 block font-mono font-semibold">Caisse principale</span>
                  <span className="font-mono text-lg font-bold text-gray-900">
                    {formatPrice(cashierTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Table of Orders */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h4 className="font-serif font-bold text-sm sm:text-base text-gray-900">
                  Historique exhaustif des commandes
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-600 font-mono uppercase border-b border-gray-200">
                    <tr>
                      <th className="p-3">Réf / Heure</th>
                      <th className="p-3">Table</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Plats commandés</th>
                      <th className="p-3">Règlement</th>
                      <th className="p-3">Montant</th>
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="p-3 font-mono">
                          <span className="text-gray-900 block font-semibold">{order.id}</span>
                          <span className="text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-700">
                          Table {order.tableNumber}
                        </td>
                        <td className="p-3">
                          <span className="text-gray-900 block font-medium">{order.customerName}</span>
                          {order.customerPhone && (
                            <span className="text-gray-500 font-mono">{order.customerPhone}</span>
                          )}
                        </td>
                        <td className="p-3 max-w-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="text-gray-700">
                              • {it.quantity}x {it.name}
                              {it.sizeName && ` (${it.sizeName})`}
                              {it.supplements && it.supplements.length > 0 && ` [+${it.supplements.join(', ')}]`}
                            </div>
                          ))}
                          {order.specialNotes && (
                            <span className="text-amber-800 italic block mt-0.5">
                              Note: {order.specialNotes}
                            </span>
                          )}
                        </td>
                        <td className="p-3 capitalize font-mono text-gray-700">
                          {order.paymentMethod === 'cash_table'
                            ? 'Espèces'
                            : order.paymentMethod === 'mobile_money'
                            ? 'Mobile Money'
                            : 'Caisse'}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-800">
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                              order.status === 'served'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : order.status === 'ready'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : order.status === 'preparing'
                                ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  nextActionLabel: string;
  onNextAction: () => void;
  onCancel?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  nextActionLabel,
  onNextAction,
  onCancel,
}) => {
  const elapsedMinutes = Math.floor((Date.now() - order.createdAt) / 60000);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 shadow-xs">
      {/* Top Table & Time */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold bg-emerald-700 text-white px-2 py-0.5 rounded-lg">
            TABLE {order.tableNumber}
          </span>
          <span className="text-xs text-gray-800 font-semibold">
            {order.customerName}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-gray-500">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>il y a {elapsedMinutes}m</span>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-1.5 text-xs">
        {order.items.map((item, idx) => (
          <div key={idx} className="bg-gray-50 p-2 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <span className="font-bold text-gray-900 text-sm">
                {item.quantity}x {item.name}
              </span>
              <span className="font-mono text-emerald-800 font-semibold">
                {formatPrice(item.totalPrice)}
              </span>
            </div>

            {item.sizeName && (
              <span className="text-[11px] text-emerald-700 font-mono block">
                Format : {item.sizeName}
              </span>
            )}

            {item.supplements && item.supplements.length > 0 && (
              <div className="text-[11px] text-gray-600 mt-0.5">
                + {item.supplements.join(', ')}
              </div>
            )}

            {item.specialInstructions && (
              <div className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 p-1 rounded mt-1">
                Instruction cuisine : "{item.specialInstructions}"
              </div>
            )}
          </div>
        ))}

        {order.specialNotes && (
          <div className="text-xs text-amber-900 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
            Note globale : {order.specialNotes}
          </div>
        )}
      </div>

      {/* Meta Total & Payment */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
        <span className="font-mono text-[11px] text-gray-500 capitalize">
          Paiement : {order.paymentMethod === 'cash_table' ? 'Espèces table' : order.paymentMethod === 'mobile_money' ? 'MoMo' : 'Caisse'}
        </span>
        <span className="font-mono font-bold text-sm text-emerald-700">
          {formatPrice(order.totalAmount)}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="pt-1 flex gap-2">
        <button
          onClick={onNextAction}
          className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center shadow-xs"
        >
          <span>{nextActionLabel}</span>
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            className="px-2.5 py-2 bg-gray-100 hover:bg-red-50 text-red-700 text-xs rounded-xl border border-gray-200 transition-colors"
            title="Annuler cette commande"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
};
