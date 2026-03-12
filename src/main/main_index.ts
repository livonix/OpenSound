import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

import { setupIpcHandlers } from './ipc/index';
import { ConfigService } from './services/config';
import { UpdaterService } from './services/updater';
import { LavalinkLocalService } from './services/lavalinkLocal';

class OpenSoundApp {
  private mainWindow: BrowserWindow | null = null;
  private configService: ConfigService;
  private dirPath: string;
  private updaterService: UpdaterService;
  private lavalinkLocalService: LavalinkLocalService;

  constructor(dirPath?: string) {
    this.configService = new ConfigService();
    this.dirPath = dirPath || __dirname;
    this.updaterService = new UpdaterService();
    this.lavalinkLocalService = new LavalinkLocalService();
  }

  private createWindow(): void {
    // Create the browser window
    const preloadPath = path.join(this.dirPath, 'preload.js');
    console.log('Preload path:', preloadPath);
    console.log('Dir path:', this.dirPath);
    
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: true, // Force la fenêtre à être visible immédiatement
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath
      },
      titleBarStyle: 'hiddenInset'
    });
    
    console.log('BrowserWindow created');

    // Load the app - always try dev server first, fallback to built file
    console.log('Loading URL: http://localhost:5173');
    this.mainWindow.loadURL('http://localhost:5173').then(() => {
      console.log('URL loaded successfully');
    }).catch((error) => {
      console.log('Failed to load dev server, loading fallback file:', error);
      // If dev server is not available, load the built file
      this.mainWindow?.loadFile(path.join(this.dirPath, '../renderer/index.html')).then(() => {
        console.log('Fallback file loaded successfully');
      }).catch((fallbackError) => {
        console.error('Failed to load fallback file:', fallbackError);
      });
    });
    
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      console.log('Window ready to show');
      this.mainWindow?.show();
      this.mainWindow?.focus();
      
      // Configurer le service de mise à jour
      this.updaterService.setMainWindow(this.mainWindow!);
      
      // Vérifier les mises à jour après le démarrage
      setTimeout(() => {
        this.updaterService.checkForUpdates();
      }, 5000); // Attendre 5 secondes après le démarrage
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      console.log('Window closed');
      this.mainWindow = null;
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'OpenSound',
        submenu: [
          { role: 'about', label: 'About OpenSound' },
          { type: 'separator' },
          { role: 'services', label: 'Services' },
          { type: 'separator' },
          { role: 'hide', label: 'Hide OpenSound' },
          { role: 'hideOthers', label: 'Hide Others' },
          { role: 'unhide', label: 'Show All' },
          { type: 'separator' },
          { role: 'quit', label: 'Quit OpenSound' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo', label: 'Undo' },
          { role: 'redo', label: 'Redo' },
          { type: 'separator' },
          { role: 'cut', label: 'Cut' },
          { role: 'copy', label: 'Copy' },
          { role: 'paste', label: 'Paste' },
          { role: 'selectAll', label: 'Select All' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload', label: 'Reload' },
          { role: 'forceReload', label: 'Force Reload' },
          { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
          { type: 'separator' },
          { role: 'resetZoom', label: 'Actual Size' },
          { role: 'zoomIn', label: 'Zoom In' },
          { role: 'zoomOut', label: 'Zoom Out' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: 'Toggle Full Screen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize', label: 'Minimize' },
          { role: 'close', label: 'Close' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  public async initialize(): Promise<void> {
    console.log('Initializing OpenSound app...');
    
    // Démarrer Lavalink local en premier
    console.log('🚀 Démarrage de Lavalink local...');
    const lavalinkStarted = await this.lavalinkLocalService.startLavalink();
    
    if (!lavalinkStarted) {
      console.error('❌ Impossible de démarrer Lavalink local');
      // Continuer quand même pour permettre le débogage
    } else {
      console.log('✅ Lavalink local démarré avec succès');
    }
    
    // Initialize config
    await this.configService.initialize();
    console.log('Config initialized');

    // Set up IPC handlers
    setupIpcHandlers();
    console.log('IPC handlers set up');

    // This method will be called when Electron has finished initialization
    app.whenReady().then(() => {
      console.log('Electron app ready, creating window...');
      this.createWindow();
      this.setupMenu();

      app.on('activate', () => {
        // On macOS, re-create window when dock icon is clicked
        if (BrowserWindow.getAllWindows().length === 0) {
          console.log('Creating new window on activate');
          this.createWindow();
        }
      });
    });

    // Quit when all windows are closed
    app.on('window-all-closed', () => {
      console.log('All windows closed');
      
      // Arrêter Lavalink local
      this.lavalinkLocalService.stopLavalink().then(() => {
        console.log('Lavalink local arrêté');
      }).catch((error) => {
        console.error('Erreur arrêt Lavalink:', error);
      });
      
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', async () => {
      console.log('Application closing, stopping Lavalink...');
      await this.lavalinkLocalService.stopLavalink();
    });

    app.on('web-contents-created', (_, contents: any) => {
      contents.setWindowOpenHandler(({ url }: { url: string }) => {
        shell.openExternal(url);
        return { action: 'deny' };
      });
    });
    
    console.log('OpenSound app initialization complete');
  }
}

export { OpenSoundApp };
