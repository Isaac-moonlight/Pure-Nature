import React, { useState } from 'react';
import { X, Plus, Minus, Check, Clock, Eye, ShoppingBag } from 'lucide-react';
import { MenuItem, PortionSize, Supplement, CartItem } from '../types';
import { formatPrice } from '../data/restaurantData';

interface ItemDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen || !item) return null;

  const [selectedSize, setSelectedSize] = useState<PortionSize | undefined>(
    item.sizes && item.sizes.length > 0 ? item.sizes[0] : undefined
  );
  const [selectedSupplements, setSelectedSupplements] = useState<Supplement[]>([]);
  const [instructions, setInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Price calculations
  const basePrice = item.price;
  const sizeOffset = selectedSize?.priceOffset || 0;
  const supplementsTotal = selectedSupplements.reduce((sum, s) => sum + s.price, 0);
  const unitPrice = basePrice + sizeOffset + supplementsTotal;
  const totalPrice = unitPrice * quantity;

  const toggleSupplement = (supp: Supplement) => {
    setSelectedSupplements((prev) =>
      prev.some((s) => s.id === supp.id)
        ? prev.filter((s) => s.id !== supp.id)
        : [...prev, supp]
    );
  };

  const handleAdd = () => {
    const cartItem: CartItem = {
      cartItemId: 'ITEM-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      menuItem: item,
      quantity,
      selectedSize,
      selectedSupplements,
      specialInstructions: instructions.trim(),
      unitPrice,
      totalPrice,
    };
    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 max-w-xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header Image */}
        <div className="relative aspect-[16/8] sm:aspect-[16/7] w-full bg-gray-100 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black/80 hover:bg-black text-white rounded-lg transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-800 bg-white px-2.5 py-0.5 rounded-md font-bold shadow-xs">
              Pure Nature Bénin
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-gray-900">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-2">
              {item.name}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              {item.description}
            </p>
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl">
              <span className="text-xs uppercase font-mono text-emerald-800 font-bold block mb-0.5">
                Ingrédients & Composition :
              </span>
              <p className="text-xs text-gray-600 italic">
                {item.ingredients}
              </p>
            </div>
          </div>

          {/* Format / Portion Sizes Selection */}
          {item.sizes && item.sizes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold block">
                1. Choisissez votre format ou portion :
              </label>
              <div className="space-y-1.5">
                {item.sizes.map((size) => {
                  const isSelected = selectedSize?.id === size.id;
                  const finalSizePrice = basePrice + size.priceOffset;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-600 text-gray-900 font-medium'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-emerald-700 bg-emerald-700' : 'border-gray-400'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                        </div>
                        <span className="text-sm">{size.name}</span>
                      </div>
                      <span className="font-mono text-xs sm:text-sm font-bold text-emerald-700">
                        {formatPrice(finalSizePrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Supplements Selection */}
          {item.availableSupplements && item.availableSupplements.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold block">
                2. Suppléments & Accompagnements au choix :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.availableSupplements.map((supp) => {
                  const isChecked = selectedSupplements.some((s) => s.id === supp.id);
                  return (
                    <button
                      key={supp.id}
                      type="button"
                      onClick={() => toggleSupplement(supp)}
                      className={`p-2.5 text-left rounded-xl border transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-600 text-gray-900'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked ? 'bg-emerald-700 border-emerald-700 text-white' : 'border-gray-400'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{supp.name}</span>
                      </div>
                      <span className="font-mono text-xs text-emerald-700 font-bold whitespace-nowrap pl-1">
                        +{formatPrice(supp.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chef instructions */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <label className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold block">
              3. Instructions spéciales pour la cuisine :
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Sans oignon, piment fort à part, bien cuit..."
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Modal Footer with Quantity and Confirm */}
        <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quantity selector */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs text-gray-500 font-mono uppercase font-semibold">Quantité :</span>
            <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Diminuer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 font-mono font-bold text-base text-gray-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Augmenter"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add button with live price */}
          <button
            type="button"
            onClick={handleAdd}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-semibold text-sm sm:text-base rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ajouter au Panier</span>
            <span className="font-mono font-bold pl-1 border-l border-white/30 ml-1">
              {formatPrice(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
