import React from 'react';
import {
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Wifi,
  Sparkles
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurantData';

export const RestaurantFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 text-gray-600 text-xs pt-10 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Col 1: Identity */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl font-bold text-gray-900">
              {RESTAURANT_INFO.name}
            </span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            {RESTAURANT_INFO.description}
          </p>
          <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Produits Naturels & Frais du Marché</span>
          </div>
        </div>

        {/* Col 2: Localisation & Horaires */}
        <div className="space-y-2.5">
          <h4 className="font-serif font-bold text-sm text-gray-900 uppercase tracking-wider">
            Adresse & Accès
          </h4>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-gray-700">{RESTAURANT_INFO.fullAddress}</p>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-700">{RESTAURANT_INFO.openingHours}</p>
              <p className="text-gray-500">{RESTAURANT_INFO.closingDay}</p>
            </div>
          </div>
        </div>

        {/* Col 3: WiFi & Contacts Directs */}
        <div className="space-y-2.5">
          <h4 className="font-serif font-bold text-sm text-gray-900 uppercase tracking-wider">
            Connectivité & Contacts
          </h4>
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-emerald-800">
              <Wifi className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">WiFi Terrasse Gratuit</span>
            </div>
            <p className="font-mono text-[11px] text-gray-600">
              Réseau : <span className="text-gray-900 font-bold">{RESTAURANT_INFO.wifiNetwork}</span>
            </p>
            <p className="font-mono text-[11px] text-gray-600">
              Mot de passe : <span className="text-gray-900 font-bold">{RESTAURANT_INFO.wifiPassword}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <a
              href={`tel:${RESTAURANT_INFO.phone}`}
              className="flex items-center gap-2 text-gray-800 hover:text-emerald-700 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono">{RESTAURANT_INFO.phoneDisplay}</span>
            </a>
            <a
              href={`https://wa.me/${RESTAURANT_INFO.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-emerald-700 hover:underline font-semibold"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Officiel ({RESTAURANT_INFO.whatsappFormatted})</span>
            </a>
          </div>
        </div>

        {/* Col 4: Règlements acceptés */}
        <div className="space-y-3">
          <h4 className="font-serif font-bold text-sm text-gray-900 uppercase tracking-wider">
            Règlements Acceptés
          </h4>
          <div className="text-[11px] text-gray-600 space-y-1.5">
            <p>• Espèces en Francs CFA (FCFA)</p>
            <p>• MTN Mobile Money (*880#)</p>
            <p>• Moov Money Bénin (*855#)</p>
            <p>• Cartes bancaires au comptoir caisse</p>
          </div>
          <div className="pt-2 text-[11px] text-gray-500 italic">
            Service continu en terrasse face à l'océan
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
        <p>
          © {new Date().getFullYear()} {RESTAURANT_INFO.name} • Cotonou, République du Bénin. Tous droits réservés.
        </p>
        <p>
          Menu digital & commande directe à table
        </p>
      </div>
    </footer>
  );
};
