import React, { useState } from 'react';
import { Plus, Clock, Leaf, Eye, Check } from 'lucide-react';
import { MenuItem } from '../types';
import { formatPrice } from '../data/restaurantData';

interface MenuItemCardProps {
  item: MenuItem;
  onOpenDetails: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onOpenDetails,
  onQuickAdd,
}) => {
  const [justAdded, setJustAdded] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickAdd(item);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <div
      onClick={() => onOpenDetails(item)}
      className="group bg-white border border-gray-200 hover:border-emerald-500 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col justify-between cursor-pointer"
    >
      {/* Top Image Showcase */}
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-gray-100">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discreet solid badges (no opacity) */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {item.isChefSpecial && (
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 bg-emerald-800 text-white rounded-full shadow-xs">
              Signature
            </span>
          )}
          {item.isVegetarian && (
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-emerald-600 text-white rounded-full shadow-xs flex items-center gap-1">
              <Leaf className="w-2.5 h-2.5" /> Végan
            </span>
          )}
          {item.spicyLevel && item.spicyLevel > 0 ? (
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-red-600 text-white rounded-full shadow-xs">
              {item.spicyLevel === 1 ? 'Piment doux' : 'Piment relevé'}
            </span>
          ) : null}
        </div>

        {item.preparationTime && (
          <div className="absolute bottom-2.5 right-3 z-10 flex items-center gap-1 text-[11px] font-mono text-gray-800 bg-white px-2.5 py-0.5 rounded-full border border-gray-200 shadow-xs">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>{item.preparationTime}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Dish Name */}
          <div className="mb-1.5">
            <h3 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug">
              {item.name}
            </h3>
          </div>

          <div className="mb-2.5">
            <span className="font-mono text-base sm:text-lg font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 inline-block">
              {formatPrice(item.price)}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
            {item.description}
          </p>

          {/* Ingredients teaser */}
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-[11px] text-gray-500 italic line-clamp-1">
            <span className="font-mono not-italic uppercase text-[10px] text-emerald-700 font-bold">Ingrédients :</span>
            <span>{item.ingredients}</span>
          </div>
        </div>

        {/* TWO BUTTONS: 1. Détails - 2. Ajouter / Commander */}
        <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
          {/* Button 1: Détails */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(item);
            }}
            className="py-2.5 px-3 bg-gray-50 hover:bg-gray-100 active:scale-95 text-gray-800 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5"
            title="Consulter les ingrédients et options"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-700" />
            <span>Détails</span>
          </button>

          {/* Button 2: Ajouter / Commander */}
          <button
            type="button"
            onClick={handleAddClick}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95 text-white ${
              justAdded
                ? 'bg-emerald-800'
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Ajouté !</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Commander</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
