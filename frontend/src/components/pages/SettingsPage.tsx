import React, { useState } from 'react';
import { Trash2, RefreshCw, Download, HardDrive } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<{ size: string; count: number } | null>(null);

  const getCacheInfo = async () => {
    try {
      const response = await fetch('/api/player/cache-info');
      const data = await response.json();
      setCacheInfo(data);
    } catch (error) {
      console.error('Failed to get cache info:', error);
    }
  };

  const clearCache = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/player/clear-cache', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        alert('Cache vidé avec succès !');
        setCacheInfo(null);
      } else {
        alert('Erreur lors du vidage du cache');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Erreur lors du vidage du cache');
    } finally {
      setIsClearing(false);
    }
  };

  React.useEffect(() => {
    getCacheInfo();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Paramètres</h1>
      
      <div className="max-w-2xl">
        {/* Cache Management Section */}
        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <HardDrive className="text-spotify-green mr-3" size={24} />
            <h2 className="text-xl font-semibold">Gestion du cache</h2>
          </div>
          
          <p className="text-gray-300 mb-6">
            Le cache audio stocke les musiques déjà écoutées pour une lecture plus rapide. 
            Vous pouvez le vider pour libérer de l'espace de stockage.
          </p>

          {cacheInfo && (
            <div className="bg-gray-700 bg-opacity-50 rounded p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400">Fichiers en cache</p>
                  <p className="text-lg font-semibold">{cacheInfo.count} morceaux</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Espace utilisé</p>
                  <p className="text-lg font-semibold">{cacheInfo.size}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={clearCache}
              disabled={isClearing}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 rounded-lg transition-colors"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  Vidage en cours...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2" size={16} />
                  Vider le cache
                </>
              )}
            </button>
            
            <button
              onClick={getCacheInfo}
              className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <RefreshCw className="mr-2" size={16} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Audio Settings Section */}
        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Download className="text-spotify-green mr-3" size={24} />
            <h2 className="text-xl font-semibold">Paramètres audio</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Qualité audio</p>
                <p className="text-sm text-gray-400">Choisissez la qualité de streaming</p>
              </div>
              <select className="bg-gray-700 text-white px-3 py-2 rounded">
                <option>Haute qualité</option>
                <option>Qualité normale</option>
                <option>Basse qualité</option>
              </select>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Cache audio</p>
                <p className="text-sm text-gray-400">Activer le cache pour une lecture plus rapide</p>
              </div>
              <button className="bg-spotify-green w-12 h-6 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Recommendation Settings Section */}
        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <RefreshCw className="text-spotify-green mr-3" size={24} />
            <h2 className="text-xl font-semibold">Recommandations</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Skip intelligent</p>
                <p className="text-sm text-gray-400">Activer les recommandations automatiques</p>
              </div>
              <button className="bg-spotify-green w-12 h-6 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Apprentissage</p>
                <p className="text-sm text-gray-400">Apprendre de vos préférences musicales</p>
              </div>
              <button className="bg-spotify-green w-12 h-6 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
