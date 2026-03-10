const { contextBridge, ipcRenderer } = require('electron');

// Exposer les API sécurisées au processus de rendu
contextBridge.exposeInMainWorld('electronAPI', {
  // Gestion des mises à jour
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  restartApp: () => ipcRenderer.invoke('restart-app'),
  
  // Boîtes de dialogue
  showErrorDialog: (title, message) => ipcRenderer.invoke('show-error-dialog', title, message),
  showInfoDialog: (title, message) => ipcRenderer.invoke('show-info-dialog', title, message),
  
  // Écouteurs d'événements
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', callback);
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', callback);
  },
  
  // Nettoyage des écouteurs
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Configuration CORS pour les appels API dans l'environnement Electron
contextBridge.exposeInMainWorld('config', {
  API_BASE_URL: 'http://localhost:3001/api',
  LAVALINK_URL: 'http://localhost:2333',
  IS_ELECTRON: true
});
