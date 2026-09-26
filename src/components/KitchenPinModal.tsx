import React, { useState, useEffect } from 'react';
import { X, ChefHat, KeyRound, AlertCircle } from 'lucide-react';

interface KitchenPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const KitchenPinModal: React.FC<KitchenPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === '0000') {
        onSuccess();
        onClose();
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 900);
      }
    }
  }, [pin, onSuccess, onClose]);

  // Handle keyboard typing
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 4) {
          setPin((prev) => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, onClose]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl p-6 text-center space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <KeyRound className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-gray-500 font-bold">
            Accès Staff Cuisine
          </span>
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-1"
            title="Retour au menu"
          >
            <span>Retour</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shadow-xs">
            <ChefHat className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-gray-900 pt-2">
            Console Cuisine & Salle
          </h3>
          <p className="text-xs text-gray-500">
            Entrez le code secret à 4 chiffres (0000)
          </p>
        </div>

        {/* PIN Indicators */}
        <div
          className={`flex justify-center items-center gap-3 py-2 transition-transform ${
            error ? 'animate-shake' : ''
          }`}
        >
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  error
                    ? 'border-red-500 bg-red-500 scale-110'
                    : isFilled
                    ? 'border-emerald-700 bg-emerald-700 scale-110 shadow-xs'
                    : 'border-gray-300 bg-gray-100'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-600 flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Code incorrect. Réessayez.</span>
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 text-gray-900 font-mono text-lg font-semibold border border-gray-200 transition-all flex items-center justify-center shadow-xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-mono transition-all flex items-center justify-center border border-gray-200"
          >
            Effacer
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-gray-50 hover:bg-gray-100 active:scale-95 text-gray-900 font-mono text-lg font-semibold border border-gray-200 transition-all flex items-center justify-center shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-mono transition-all flex items-center justify-center border border-gray-200"
          >
            ⌫
          </button>
        </div>

        {/* Cancel / Return to Menu Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl border border-gray-300 transition-colors"
          >
            Annuler et Retourner au Menu
          </button>
        </div>
      </div>
    </div>
  );
};
