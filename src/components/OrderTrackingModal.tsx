import React, { useMemo } from 'react';
import {
  X,
  Clock,
  ChefHat,
  Bell,
  CheckCircle2,
  AlertCircle,
  Flame,
  UtensilsCrossed,
  BellRing
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatPrice } from '../data/restaurantData';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  currentTable: number;
  onOpenWaiterCall: () => void;
}

const STATUS_STEPS: { key: OrderStatus; label: string; icon: React.ElementType; desc: string }[] = [
  {
    key: 'pending',
    label: 'Reçue',
    icon: Bell,
    desc: 'Enregistrée par la cuisine',
  },
  {
    key: 'preparing',
    label: 'En cuisine',
    icon: Flame,
    desc: 'Sur le grill & au feu de bois',
  },
  {
    key: 'ready',
    label: 'Prête',
    icon: UtensilsCrossed,
    desc: 'Au passe-plat, départ imminent',
  },
  {
    key: 'served',
    label: 'Servie',
    icon: CheckCircle2,
    desc: 'Bon appétit à votre table !',
  },
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  orders,
  currentTable,
  onOpenWaiterCall,
}) => {
  if (!isOpen) return null;

  const storedRecentIds: string[] = useMemo(() => {
    try {
      const data = localStorage.getItem('pn_my_recent_order_ids');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, [isOpen]);

  const displayOrders = useMemo(() => {
    return orders.filter((o) => {
      const isForTable = Number(o.tableNumber) === Number(currentTable);
      const isRecentDeviceOrder = storedRecentIds.includes(o.id);
      return isForTable || isRecentDeviceOrder;
    });
  }, [orders, currentTable, storedRecentIds]);

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'preparing':
        return 1;
      case 'ready':
        return 2;
      case 'served':
        return 3;
      case 'cancelled':
        return -1;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 max-w-xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-gray-900">
                  Suivi de Commande en Direct
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <p className="text-xs text-gray-500">
                Table N° <span className="font-mono font-bold text-emerald-700">{currentTable}</span> • Pure Nature Terrasse
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
            title="Retour au menu principal"
          >
            <span>Retour au menu</span>
            <X className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {displayOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-500 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Clock className="w-8 h-8 text-emerald-700" />
              </div>
              <p className="font-serif text-lg text-gray-800">
                Aucune commande active pour le moment
              </p>
              <p className="text-xs max-w-sm mx-auto text-gray-600">
                Sélectionnez vos plats sur la carte et validez votre panier. Dès validation, la préparation commence instantanément en cuisine !
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  Retour au Menu & Découvrir la carte
                </button>
              </div>
            </div>
          ) : (
            displayOrders.map((order) => {
              const currentStepIdx = getStepIndex(order.status);
              const isCancelled = order.status === 'cancelled';
              const elapsedMinutes = Math.floor((Date.now() - order.createdAt) / 60000);

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs"
                >
                  {/* Order meta bar */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          Table {order.tableNumber}
                        </span>
                        <span className="text-[11px] font-mono text-gray-500">
                          Réf. {order.id.slice(-8)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 block mt-1">
                        Commandé il y a {elapsedMinutes < 1 ? 'quelques instants' : `${elapsedMinutes} min`} (
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-base sm:text-lg text-emerald-800">
                        {formatPrice(order.totalAmount)}
                      </span>
                      <span className="text-[11px] text-gray-500 block capitalize font-mono">
                        {order.paymentMethod === 'cash_table'
                          ? 'Espèces à table'
                          : order.paymentMethod === 'mobile_money'
                          ? 'Mobile Money'
                          : 'Caisse'}
                      </span>
                    </div>
                  </div>

                  {/* Stepper */}
                  {isCancelled ? (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-center text-sm text-red-700 flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Cette commande a été annulée</span>
                    </div>
                  ) : (
                    <div className="pt-2 pb-1">
                      <div className="grid grid-cols-4 gap-1 relative">
                        {/* Connecting Line */}
                        <div className="absolute top-4 left-4 right-4 h-1 bg-gray-200 -z-0 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 transition-all duration-500"
                            style={{ width: `${(Math.max(0, currentStepIdx) / 3) * 100}%` }}
                          />
                        </div>

                        {STATUS_STEPS.map((step, idx) => {
                          const isDone = currentStepIdx >= idx;
                          const isCurrent = currentStepIdx === idx;
                          const StepIcon = step.icon;

                          return (
                            <div key={step.key} className="flex flex-col items-center text-center z-10">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                  isCurrent
                                    ? 'bg-emerald-600 border-emerald-700 text-white scale-110 shadow-sm'
                                    : isDone
                                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                                    : 'bg-white border-gray-300 text-gray-400'
                                }`}
                              >
                                <StepIcon className="w-4 h-4 stroke-[2.5]" />
                              </div>
                              <span
                                className={`text-[11px] sm:text-xs font-semibold mt-1.5 leading-tight ${
                                  isCurrent
                                    ? 'text-emerald-800 font-bold'
                                    : isDone
                                    ? 'text-gray-800'
                                    : 'text-gray-400'
                                }`}
                              >
                                {step.label}
                              </span>
                              <span className="text-[9px] text-gray-500 hidden sm:block mt-0.5 max-w-[85px]">
                                {step.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Order Items list */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5 text-xs">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold block mb-1">
                      Détail de votre commande :
                    </span>
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-start text-gray-700 py-0.5 border-b border-gray-200 last:border-0">
                        <div>
                          <span className="font-semibold text-gray-900">
                            {item.quantity}x {item.name}
                          </span>
                          {item.sizeName && (
                            <span className="text-[11px] text-emerald-700 ml-1">({item.sizeName})</span>
                          )}
                          {item.supplements && item.supplements.length > 0 && (
                            <span className="block text-[11px] text-gray-500">
                              + {item.supplements.join(', ')}
                            </span>
                          )}
                          {item.specialInstructions && (
                            <span className="block text-[11px] text-amber-800 italic">
                              "{item.specialInstructions}"
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-emerald-800 font-semibold whitespace-nowrap pl-2">
                          {formatPrice(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Quick waiter help */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-gray-500">
                      Un besoin particulier ?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenWaiterCall();
                      }}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-emerald-800 border border-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>Appeler le serveur</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Mise à jour en temps réel</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Retour au Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
