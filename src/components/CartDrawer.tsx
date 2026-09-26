import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  Banknote,
  Building2,
  CheckCircle2,
  Send,
  Loader2,
  Smartphone
} from 'lucide-react';
import { CartItem, PaymentMethod } from '../types';
import { RESTAURANT_INFO, formatPrice } from '../data/restaurantData';
import { createOrderInFirestore } from '../lib/firebase';
import { playOrderBell } from '../utils/audio';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currentTable: number;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  currentTable,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
}) => {
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('pn_customer_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('pn_customer_phone') || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_table');
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  // WhatsApp structured order backup (clean text, no emojis)
  const generateWhatsAppMessage = () => {
    let text = `*COMMANDE PURE NATURE BÉNIN*\n`;
    text += `*Table N° ${currentTable}* (Terrasse Marina)\n`;
    if (customerName) text += `Client : ${customerName}\n`;
    if (customerPhone) text += `Téléphone : ${customerPhone}\n`;
    text += `\n*DÉTAILS DES PLATS :*\n`;

    cartItems.forEach((item, idx) => {
      text += `${idx + 1}. *${item.quantity}x ${item.menuItem.name}*`;
      if (item.selectedSize) text += ` (${item.selectedSize.name})`;
      text += ` - ${formatPrice(item.totalPrice)}\n`;
      if (item.selectedSupplements.length > 0) {
        text += `   + Suppléments : ${item.selectedSupplements.map((s) => s.name).join(', ')}\n`;
      }
      if (item.specialInstructions) {
        text += `   Note : "${item.specialInstructions}"\n`;
      }
    });

    text += `\n*TOTAL : ${formatPrice(totalAmount)}*\n`;
    const payLabel =
      paymentMethod === 'cash_table'
        ? 'Espèces au serveur à table'
        : paymentMethod === 'mobile_money'
        ? 'Mobile Money (MTN MoMo / Moov)'
        : 'Paiement en caisse';
    text += `Règlement prévu : ${payLabel}\n`;
    if (specialNotes) text += `Remarque globale : ${specialNotes}\n`;
    text += `\nMerci de lancer la préparation en cuisine !`;

    return encodeURIComponent(text);
  };

  const handleWhatsAppSend = () => {
    const text = generateWhatsAppMessage();
    const url = `https://wa.me/${RESTAURANT_INFO.whatsappNumber}?text=${text}`;
    window.open(url, '_blank');
  };

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) return;

    setIsSubmitting(true);

    if (customerName) localStorage.setItem('pn_customer_name', customerName);
    if (customerPhone) localStorage.setItem('pn_customer_phone', customerPhone);

    const payloadItems = cartItems.map((item) => ({
      id: item.menuItem.id,
      name: item.menuItem.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      sizeName: item.selectedSize?.name || '',
      supplements: item.selectedSupplements.map((s) => s.name),
      specialInstructions: item.specialInstructions || '',
    }));

    try {
      const orderId = await createOrderInFirestore({
        tableNumber: Number(currentTable),
        customerName: customerName.trim() || `Client Table ${currentTable}`,
        customerPhone: customerPhone.trim() || '',
        items: payloadItems,
        totalAmount,
        status: 'pending',
        paymentMethod,
        paymentStatus: 'pending',
        specialNotes: specialNotes.trim() || '',
        createdAt: Date.now(),
      });

      // Save to recent device orders so tracking modal ALWAYS finds it
      try {
        const stored = JSON.parse(localStorage.getItem('pn_my_recent_order_ids') || '[]');
        const updated = [orderId, ...stored.filter((id: string) => id !== orderId)].slice(0, 20);
        localStorage.setItem('pn_my_recent_order_ids', JSON.stringify(updated));
      } catch {
        // safe
      }

      playOrderBell();
      onClearCart();
      setIsSubmitting(false);
      onOrderSuccess(orderId);
    } catch (err) {
      console.error('Order creation error:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900 animate-in fade-in duration-200">
      <div className="bg-white border-l border-gray-200 w-full max-w-lg h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>Votre Panier</span>
              <span className="font-mono text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full border border-emerald-300">
                Table {currentTable}
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              Commande transmise en direct à la cuisine
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
            title="Retour au menu"
          >
            <span>Retour au menu</span>
            <X className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Scrollable Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="py-16 text-center text-gray-500 space-y-4">
              <p className="font-serif text-lg text-gray-800">Votre panier est vide</p>
              <p className="text-xs max-w-xs mx-auto text-gray-600">
                Découvrez nos grillades de poissons du large, nos spécialités béninoises et nos jus pressés 100% naturels !
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                Retour au menu principal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.cartItemId}
                  className="bg-white border border-gray-200 p-3.5 rounded-xl flex flex-col gap-2 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-serif text-base font-bold text-gray-900 leading-tight">
                        {item.menuItem.name}
                      </h4>
                      {item.selectedSize && (
                        <p className="text-xs text-emerald-700 font-mono mt-0.5 font-medium">
                          {item.selectedSize.name}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-sm text-emerald-700 whitespace-nowrap">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>

                  {item.selectedSupplements.length > 0 && (
                    <div className="text-xs text-gray-600 space-y-0.5 border-l-2 border-emerald-500 pl-2 my-0.5">
                      {item.selectedSupplements.map((s) => (
                        <div key={s.id} className="flex justify-between">
                          <span>+ {s.name}</span>
                          <span className="font-mono text-[11px] text-emerald-700">
                            +{formatPrice(s.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.specialInstructions && (
                    <p className="text-xs text-amber-900 italic bg-amber-50 p-2 rounded-lg border border-amber-200">
                      Note chef : "{item.specialInstructions}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      onClick={() => onRemoveItem(item.cartItemId)}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Retirer</span>
                    </button>

                    <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                        className="p-1 px-2.5 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-xs font-bold px-2 text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                        className="p-1 px-2.5 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cartItems.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              {/* Customer Contact */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold block">
                  Service à la Table N° {currentTable} :
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Votre Nom ou Prénom"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600"
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone (WhatsApp/MoMo)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold block">
                  Mode de règlement souhaité :
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash_table')}
                    className={`w-full p-2.5 text-left border rounded-xl transition-all flex items-center justify-between text-xs ${
                      paymentMethod === 'cash_table'
                        ? 'bg-emerald-50 border-emerald-500 text-gray-900'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-semibold block text-gray-900">Espèces au serveur à table</span>
                        <span className="text-[11px] text-gray-500">Règlement au passage du serveur</span>
                      </div>
                    </div>
                    {paymentMethod === 'cash_table' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile_money')}
                    className={`w-full p-2.5 text-left border rounded-xl transition-all flex items-center justify-between text-xs ${
                      paymentMethod === 'mobile_money'
                        ? 'bg-emerald-50 border-emerald-500 text-gray-900'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="font-semibold block text-gray-900">Mobile Money (MTN MoMo / Moov)</span>
                        <span className="text-[11px] text-gray-500">Code marchand direct</span>
                      </div>
                    </div>
                    {paymentMethod === 'mobile_money' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>}
                  </button>

                  {paymentMethod === 'mobile_money' && (
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl text-[11px] font-mono text-gray-700 space-y-1">
                      <div className="text-emerald-800 font-bold">Numéros Marchand Pure Nature :</div>
                      <div>• MTN MoMo : <span className="text-gray-900 select-all font-bold">{RESTAURANT_INFO.momoInfo.mtn}</span></div>
                      <div>• Moov Money : <span className="text-gray-900 select-all font-bold">{RESTAURANT_INFO.momoInfo.moov}</span></div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cashier')}
                    className={`w-full p-2.5 text-left border rounded-xl transition-all flex items-center justify-between text-xs ${
                      paymentMethod === 'cashier'
                        ? 'bg-emerald-50 border-emerald-500 text-gray-900'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="font-semibold block text-gray-900">Paiement en Caisse principale</span>
                        <span className="text-[11px] text-gray-500">Au comptoir avant le départ</span>
                      </div>
                    </div>
                    {paymentMethod === 'cashier' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>}
                  </button>
                </div>
              </div>

              {/* Special overall notes */}
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold block">
                  Remarque générale pour le chef :
                </span>
                <input
                  type="text"
                  placeholder="Ex: Servir les boissons fraîches en premier, sans sel..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary & Order Actions */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50 space-y-3">
            <div className="flex items-center justify-between text-base sm:text-lg">
              <span className="font-serif font-bold text-gray-900">Total à régler :</span>
              <span className="font-mono font-bold text-xl sm:text-2xl text-emerald-700">
                {formatPrice(totalAmount)}
              </span>
            </div>

            {/* Direct Send button */}
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-semibold text-sm sm:text-base rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Envoi direct en cuisine...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>Envoyer la Commande en Cuisine</span>
                </>
              )}
            </button>

            {/* WhatsApp Backup Button */}
            <button
              type="button"
              onClick={handleWhatsAppSend}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs sm:text-sm rounded-xl border border-emerald-300 transition-all flex items-center justify-center gap-2"
              title="Envoi de secours par message officiel WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Envoyer directement par WhatsApp (Secours)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
