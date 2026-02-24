import React, { useState } from 'react';
import { X, Star, MapPin, Clock, Phone, Globe, Share2, Heart, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlaceDetailProps {
  location: any;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export function PlaceDetail({ location, onClose, isFavorite, onToggleFavorite }: PlaceDetailProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'reviews'>('info');

  const handleShare = () => {
    const url = `${window.location.origin}?q=${encodeURIComponent(location.query)}&name=${encodeURIComponent(location.name)}`;
    
    if (navigator.share) {
      navigator.share({
        title: location.name,
        text: `Confira este lugar: ${location.name}`,
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');
    }
  };

  if (!location || location.id === 999) return null;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-4 right-4 bottom-4 w-full max-w-md bg-white rounded-2xl shadow-2xl z-20 overflow-hidden flex flex-col border border-gray-100"
    >
      {/* Header Image */}
      <div className="relative h-48 bg-gray-200 shrink-0">
        {location.photoUrl ? (
          <img src={location.photoUrl} alt={location.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            <span className="text-4xl">📷</span>
          </div>
        )}
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
          <h2 className="text-xl font-bold text-white truncate">{location.name}</h2>
          <p className="text-white/90 text-sm truncate">{location.type}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
        <div className="flex gap-2">
          <button 
            onClick={onToggleFavorite}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isFavorite 
                ? 'bg-red-50 text-red-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            {isFavorite ? 'Salvo' : 'Salvar'}
          </button>
          <button 
            onClick={handleShare}
            className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            title="Compartilhar"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-yellow-500 font-bold">
            <span className="text-lg">{location.rating || '-'}</span>
            <Star className="w-4 h-4 fill-current" />
          </div>
          <span className="text-xs text-gray-400">{location.userRatingCount || 0} avaliações</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {['info', 'photos', 'reviews'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors relative ${
              activeTab === tab ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'info' ? 'Informações' : tab === 'photos' ? 'Fotos' : 'Avaliações'}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-3 shadow-sm">
              <div className="flex items-start gap-3 text-gray-600">
                <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-indigo-500" />
                <span className="text-sm">{location.query}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Clock className="w-5 h-5 shrink-0 text-indigo-500" />
                <span className="text-sm text-green-600 font-medium">Aberto agora</span>
                <span className="text-xs text-gray-400">• Fecha às 22:00</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="w-5 h-5 shrink-0 text-indigo-500" />
                <span className="text-sm">(11) 99999-9999</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Globe className="w-5 h-5 shrink-0 text-indigo-500" />
                <a href="#" className="text-sm text-indigo-600 hover:underline">website.com</a>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Sobre</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Um local incrível para visitar com a família e amigos. Oferece uma experiência única com ambiente agradável e serviço de alta qualidade.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img 
                  src={`https://picsum.photos/seed/${location.id + i}/200/200`} 
                  alt="Gallery" 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                    U{i}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Usuário {i}</div>
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Experiência fantástica! Recomendo muito a visita. O atendimento foi impecável e o ambiente é muito acolhedor.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-white border-t border-gray-100">
        <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2">
          <Navigation className="w-5 h-5" />
          Ir para lá
        </button>
      </div>
    </motion.div>
  );
}
