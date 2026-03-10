import React, { useState, useEffect } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';

export const UpdateBanner: React.FC = () => {
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Vérifier si on est en mode Electron
    const isElectron = (window as any).config?.IS_ELECTRON || false;
    if (!isElectron) return;

    const electronAPI = (window as any).electronAPI;

    // Écouter les événements de mise à jour
    const handleUpdateAvailable = () => {
      setIsVisible(true);
    };

    const handleUpdateDownloaded = () => {
      setUpdateDownloaded(true);
    };

    if (electronAPI) {
      electronAPI.onUpdateAvailable(handleUpdateAvailable);
      electronAPI.onUpdateDownloaded(handleUpdateDownloaded);

      return () => {
        electronAPI.removeAllListeners('update-available');
        electronAPI.removeAllListeners('update-downloaded');
      };
    }
  }, []);

  const handleCheckForUpdates = () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      electronAPI.checkForUpdates();
    }
  };

  const handleRestart = () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      electronAPI.restartApp();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const isElectron = (window as any).config?.IS_ELECTRON || false;
  if (!isElectron) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {updateDownloaded ? (
          <AlertCircle size={16} className="text-green-300" />
        ) : (
          <Download size={16} />
        )}
        <span className="text-sm font-medium">
          {updateDownloaded 
            ? 'Mise à jour prête - Redémarrez pour installer' 
            : 'Une mise à jour est disponible'
          }
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {!updateDownloaded && (
          <button
            onClick={handleCheckForUpdates}
            className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors"
          >
            Télécharger
          </button>
        )}
        
        {updateDownloaded && (
          <button
            onClick={handleRestart}
            className="text-xs bg-green-500 hover:bg-green-600 px-2 py-1 rounded transition-colors"
          >
            Redémarrer
          </button>
        )}
        
        <button
          onClick={handleDismiss}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
