import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

import { setupIpcHandlers } from './ipc/index';
import { ConfigService } from './services/config';
import { StreamProxyService } from './services/streamProxy';
import { UpdaterService } from './services/updater';

class OpenSoundApp {
  private mainWindow: BrowserWindow | null = null;
  private configService: ConfigService;
  private dirPath: string;
  private updaterService: UpdaterService;
  private streamProxyService: StreamProxyService;

  constructor(dirPath?: string) {
    this.configService = new ConfigService();
    this.dirPath = dirPath || __dirname;
    this.updaterService = new UpdaterService();
    this.streamProxyService = new StreamProxyService();
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
          { 
            label: 'Check for Updates', 
            click: () => {
              this.updaterService.checkForUpdates();
            }
          },
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
    
    console.log('🚀 YouTube streaming service ready (no Java required)');
    
    // Start stream proxy server
    try {
      await this.streamProxyService.start();
      console.log('🌐 Stream proxy server started');
    } catch (error) {
      console.error('Failed to start stream proxy server:', error);
    }
    
    // Initialize config
    await this.configService.initialize();
    console.log('Config initialized');

    // Set up IPC handlers
    setupIpcHandlers();
    console.log('IPC handlers set up');

    console.log('OpenSound app initialization complete');
    
    // Wait for app to be ready before creating window
    await app.whenReady();
    console.log('Electron app ready, creating window...');
    this.setupMenu();
    this.createWindow();

    app.on('activate', () => {
      // On macOS, re-create window when dock icon is clicked
      if (BrowserWindow.getAllWindows().length === 0) {
        console.log('Creating new window on activate');
        this.createWindow();
      }
    });

    // Quit when all windows are closed
    app.on('window-all-closed', () => {
      console.log('All windows closed');
      console.log('YouTube streaming service stopped');
      
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', async () => {
      console.log('Application closing, YouTube streaming service cleanup...');
      await this.streamProxyService.stop();
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
