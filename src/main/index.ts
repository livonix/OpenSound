import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
const result = config();
console.log('Dotenv config result:', result);
console.log('Environment variables loaded:', {
  SPOTIFY_CLIENT_ID: !!process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: !!process.env.SPOTIFY_CLIENT_SECRET,
  NODE_ENV: process.env.NODE_ENV
});

import { setupIpcHandlers } from './ipc/index';
import { ConfigService } from './services/config';

// CommonJS equivalent of __dirname
const mainDirname = path.dirname(__filename);

import { OpenSoundApp } from './main_index';

const appInstance = new OpenSoundApp(mainDirname);
appInstance.initialize();
