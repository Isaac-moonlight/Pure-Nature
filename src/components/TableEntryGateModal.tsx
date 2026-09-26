import React, { useState } from 'react';
import { QrCode, UtensilsCrossed, MapPin, ArrowRight } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurantData';

interface TableEntryGateModalProps {
  isOpen: boolean;
  selectedTable: number;
  onConfirm: (tableNum: number) => void;
}

export const TableEntryGateModal: React.FC<TableEntryGateModalProps> = ({
  isOpen,
  selectedTable,
  onConfirm,
}) => {
  const [activeTable, setActiveTable] = useState<number>(selectedTable || 1);

  if (!isOpen) return null;

  const tables = Array.from({ length: RESTAURANT_INFO.tablesCount }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900 animate-in fade-in duration-300">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-6 bg-gray-50 border-b border-gray-200 text-center space-y-2 relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-xs">
            <UtensilsCrossed className="w-7 h-7" />
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Pure Nature Bénin
          </h2>

          <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto">
            Bienvenue en terrasse. Veuillez indiquer votre numéro de table pour synchroniser votre commande en direct avec la cuisine.
          </p>

          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-xs">
            <MapPin className="w-3 h-3 text-emerald-600" />
            <span>Boulevard de la Marina, Cotonou</span>
          </div>
        </div>

        {/* Table Selector Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-700 font-semibold flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              Sélectionnez votre numéro de table :
            </span>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-300">
              Table {activeTable}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
            {tables.map((tableNum) => {
              const isSelected = tableNum === activeTable;
              return (
                <button
                  key={tableNum}
                  type="button"
                  onClick={() => setActiveTable(tableNum)}
                  className={`h-14 rounded-xl font-mono text-base font-bold transition-all flex flex-col items-center justify-center relative border ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm scale-105'
                      : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-gray-400">Table</span>
                  <span>{tableNum}</span>
                  {isSelected && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white"></span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-gray-500 text-center pt-1">
            Le numéro de votre table est indiqué sur le chevalet posé devant vous.
          </p>
        </div>

        {/* Footer Confirm Button */}
        <div className="p-5 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[11px] text-gray-500 block font-mono">Table assignée</span>
            <span className="font-serif text-lg font-bold text-gray-900">
              Table N° <span className="text-emerald-700">{activeTable}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => onConfirm(activeTable)}
            className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-semibold text-sm sm:text-base rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <span>Accéder au Menu</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
