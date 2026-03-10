import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

import { setupIpcHandlers } from './ipc/index.js';
import { ConfigService } from './services/config.js';

// ES module equivalent of __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

class OpenSoundApp {
  private mainWindow: BrowserWindow | null = null;
  private configService: ConfigService;

  constructor() {
    this.configService = new ConfigService();
  }

  private createWindow(): void {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      titleBarStyle: 'hiddenInset',
      show: false
    });

    // Load the app - always try dev server first, fallback to built file
    this.mainWindow.loadURL('http://localhost:5173').catch(() => {
      // If dev server is not available, load the built file
      this.mainWindow?.loadFile(path.join(__dirname, '../renderer/index.html'));
    });
    
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
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
    // Initialize config
    await this.configService.initialize();

    // Set up IPC handlers
    setupIpcHandlers();

    // This method will be called when Electron has finished initialization
    app.whenReady().then(() => {
      this.createWindow();
      this.setupMenu();

      app.on('activate', () => {
        // On macOS, re-create window when dock icon is clicked
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    // Quit when all windows are closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('web-contents-created', (_, contents: any) => {
      contents.setWindowOpenHandler(({ url }: { url: string }) => {
        shell.openExternal(url);
        return { action: 'deny' };
      });
    });
  }
}

// Initialize the application
const openSoundApp = new OpenSoundApp();
openSoundApp.initialize().catch(console.error);
