import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

import { setupIpcHandlers } from './ipc/index';
import { ConfigService } from './services/config';

// CommonJS equivalent of __dirname
const mainDirname = path.dirname(__filename);

import { OpenSoundApp } from './main_index';

const appInstance = new OpenSoundApp(mainDirname);
appInstance.initialize();
