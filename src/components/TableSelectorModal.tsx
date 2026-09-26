import React, { useState } from 'react';
import { X, Check, QrCode, MapPin, Share2 } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurantData';

interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable: number;
  onSelectTable: (tableNum: number) => void;
}

export const TableSelectorModal: React.FC<TableSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTable,
  onSelectTable,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const tables = Array.from({ length: RESTAURANT_INFO.tablesCount }, (_, i) => i + 1);
  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?table=${currentTable}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-gray-900">
                Changer de Table
              </h3>
              <p className="text-xs text-gray-500">
                Pour la commande directe et le service en terrasse
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 block uppercase tracking-wider font-mono font-bold">
                Table Actuelle
              </span>
              <span className="font-serif text-xl font-bold text-gray-900">
                Table N° <span className="text-emerald-700">{currentTable}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-mono bg-white px-2.5 py-1 rounded-lg border border-emerald-300 font-bold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Connectée
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-2 font-mono uppercase">
              Choisissez votre numéro de table (1 à 25) :
            </label>
            <div className="grid grid-cols-5 gap-2">
              {tables.map((tableNum) => {
                const isSelected = tableNum === currentTable;
                return (
                  <button
                    key={tableNum}
                    onClick={() => {
                      onSelectTable(tableNum);
                      onClose();
                    }}
                    className={`py-3 px-2 rounded-xl font-mono text-sm font-semibold transition-all flex flex-col items-center justify-center border relative ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] uppercase opacity-75">T</span>
                    <span className="text-base font-bold">{tableNum}</span>
                    {isSelected && (
                      <Check className="w-3 h-3 absolute top-1 right-1 stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* QR Code link tester */}
          <div className="pt-3 border-t border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 font-mono flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Lien QR Code de cette table :
              </span>
              <button
                onClick={handleCopyLink}
                className="text-xs text-emerald-700 hover:underline font-mono font-semibold"
              >
                {copied ? 'Copié !' : 'Copier le lien'}
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-[11px] font-mono text-gray-600 truncate select-all">
              {currentUrl}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
