import React, { useState } from 'react';
import { X, BellRing, Receipt, GlassWater, PlusCircle, HelpCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { sendWaiterCall } from '../lib/firebase';
import { playWaiterCallChime } from '../utils/audio';
import { WaiterCallReason } from '../types';

interface WaiterCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: number;
}

const REASONS: { id: WaiterCallReason; label: string; icon: React.ElementType; desc: string }[] = [
  {
    id: 'addition',
    label: "Demander l'addition",
    icon: Receipt,
    desc: 'Le serveur apportera votre facture à table',
  },
  {
    id: 'eau',
    label: "Carafe d'eau & Couverts",
    icon: GlassWater,
    desc: 'Eau fraîche, verres supplémentaires ou serviettes',
  },
  {
    id: 'service',
    label: 'Commander un supplément',
    icon: PlusCircle,
    desc: 'Boissons fraîches, pain, sauces ou accompagnements',
  },
  {
    id: 'question',
    label: 'Assistance serveur',
    icon: HelpCircle,
    desc: 'Une question sur un plat ou un besoin particulier',
  },
];

export const WaiterCallModal: React.FC<WaiterCallModalProps> = ({
  isOpen,
  onClose,
  tableNumber,
}) => {
  const [selectedReason, setSelectedReason] = useState<WaiterCallReason>('addition');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await sendWaiterCall(tableNumber, selectedReason, note.trim());
      playWaiterCallChime();
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setNote('');
        onClose();
      }, 2200);
    } catch (e) {
      console.error('Failed to send waiter call:', e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-gray-900">
                Appeler le Serveur
              </h3>
              <p className="text-xs text-gray-500">
                Pour la <span className="font-bold text-emerald-700">Table {tableNumber}</span> en terrasse
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            title="Retour au menu"
          >
            <span>Retour</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-serif text-xl font-bold text-gray-900">
                Demande transmise au personnel !
              </h4>
              <p className="text-sm text-gray-600 max-w-xs mx-auto">
                Un serveur de Pure Nature se présente à la <span className="font-bold text-emerald-700">Table {tableNumber}</span> d'un instant à l'autre.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-2.5 font-mono uppercase">
                  Motif de votre appel :
                </label>
                <div className="space-y-2">
                  {REASONS.map((r) => {
                    const isSelected = selectedReason === r.id;
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedReason(r.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 text-gray-900 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg mt-0.5 ${
                            isSelected ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold flex items-center justify-between">
                            <span>{r.label}</span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1 font-mono uppercase">
                  Précision facultative :
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: Facture séparée, eau très fraîche, serviettes..."
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-xs disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmission au serveur...</span>
                  </>
                ) : (
                  <>
                    <BellRing className="w-4 h-4" />
                    <span>Envoyer l'appel (Table {tableNumber})</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
