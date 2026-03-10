const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');
const axios = require('axios');

let mainWindow;
let backendProcess;
let lavalinkProcess;

// Configuration de l'auto-updater
autoUpdater.checkForUpdatesAndNotify();
autoUpdater.on('update-available', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Mise à jour disponible',
    message: 'Une nouvelle version d\'OpenSound est disponible. Téléchargement en cours...',
    buttons: ['OK']
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Mise à jour prête',
    message: 'La mise à jour a été téléchargée. L\'application va redémarrer.',
    buttons: ['Redémarrer maintenant', 'Plus tard']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    titleBarStyle: 'default'
  });

  // Charger l'application React
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../frontend/dist/index.html')}`;
  console.log('Loading URL:', startUrl);
  
  mainWindow.loadURL(startUrl).catch(err => {
    console.error('Failed to load URL:', err);
    // Fallback: try to load from dev server
    mainWindow.loadURL('http://localhost:3000').catch(err2 => {
      console.error('Failed to load dev server:', err2);
      // Show error message
      mainWindow.webContents.loadURL(`data:text/html,<h1>Erreur de chargement</h1><p>Veuillez builder le frontend avec: npm run build</p>`);
    });
  });

  // Afficher la fenêtre quand elle est prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Gérer la fermeture
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Ouvrir les DevTools en développement
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// Démarrer le backend
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Démarrage du backend...');
    
    // Vérifier si le backend est compilé
    const backendDistPath = path.join(__dirname, '../backend/dist');
    if (!require('fs').existsSync(backendDistPath)) {
      console.log('⚠️ Backend not compiled, skipping backend startup');
      console.log('💡 Run "cd backend && npm run build" to compile the backend');
      resolve();
      return;
    }
    
    backendProcess = spawn('node', ['dist/index.js'], {
      cwd: path.join(__dirname, '../backend'),
      stdio: 'pipe',
      shell: true
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
      if (code !== 0) {
        reject(new Error(`Backend exited with code ${code}`));
      }
    });

    // Attendre que le backend soit prêt
    const checkBackend = async () => {
      try {
        await axios.get('http://localhost:3001/health');
        console.log('✅ Backend prêt');
        resolve();
      } catch (error) {
        setTimeout(checkBackend, 1000);
      }
    };

    setTimeout(checkBackend, 2000);
  });
}

// Démarrer Lavalink
function startLavalink() {
  return new Promise((resolve, reject) => {
    console.log('🎵 Démarrage de Lavalink...');
    
    const lavalinkPath = path.join(__dirname, '../backend/Lavalink.jar');
    console.log('Lavalink path:', lavalinkPath);
    
    // Vérifier si le fichier Lavalink.jar existe
    if (!require('fs').existsSync(lavalinkPath)) {
      console.log('⚠️ Lavalink.jar not found, skipping Lavalink startup');
      resolve();
      return;
    }
    
    lavalinkProcess = spawn('java', ['-jar', lavalinkPath], {
      cwd: path.join(__dirname, '../backend'),
      stdio: 'pipe',
      shell: true
    });

    lavalinkProcess.stdout.on('data', (data) => {
      console.log(`Lavalink: ${data}`);
    });

    lavalinkProcess.stderr.on('data', (data) => {
      console.error(`Lavalink Error: ${data}`);
    });

    lavalinkProcess.on('close', (code) => {
      console.log(`Lavalink process exited with code ${code}`);
      if (code !== 0) {
        reject(new Error(`Lavalink exited with code ${code}`));
      }
    });

    // Attendre que Lavalink soit prêt
    const checkLavalink = async () => {
      try {
        await axios.get('http://localhost:2333/v4/info');
        console.log('✅ Lavalink prêt');
        resolve();
      } catch (error) {
        setTimeout(checkLavalink, 1000);
      }
    };

    setTimeout(checkLavalink, 5000);
  });
}

// IPC Handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('check-for-updates', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit();
});

ipcMain.handle('show-error-dialog', (event, title, message) => {
  dialog.showErrorBox(title, message);
});

ipcMain.handle('show-info-dialog', (event, title, message) => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: title,
    message: message,
    buttons: ['OK']
  });
});

// Nettoyage à la fermeture
app.on('before-quit', async () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (lavalinkProcess) {
    lavalinkProcess.kill();
  }
});

// Quand l'application est prête
app.whenReady().then(async () => {
  try {
    console.log('🚀 Starting OpenSound Electron app...');
    
    // Créer la fenêtre principale immédiatement pour le test
    createWindow();
    
    // Démarrer les services en arrière-plan (non bloquant)
    setTimeout(async () => {
      try {
        console.log('🎵 Attempting to start Lavalink...');
        await startLavalink();
      } catch (error) {
        console.log('⚠️ Lavalink failed to start (continuing without it):', error.message);
      }
      
      try {
        console.log('🚀 Attempting to start backend...');
        await startBackend();
      } catch (error) {
        console.log('⚠️ Backend failed to start (continuing without it):', error.message);
      }
    }, 2000);
    
  } catch (error) {
    console.error('Erreur au démarrage:', error);
    if (mainWindow) {
      dialog.showErrorBox('Erreur de démarrage', 'Impossible de démarrer l\'application.');
    }
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (mainWindow) {
    dialog.showErrorBox('Erreur', 'Une erreur inattendue est survenue.');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
