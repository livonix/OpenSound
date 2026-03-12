import { autoUpdater } from 'electron-updater';
import { app, dialog, BrowserWindow } from 'electron';
import log from 'electron-log';

export class UpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private updateAvailable: boolean = false;

  constructor() {
    // Configuration du logger
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    // Configuration des événements
    this.setupEventHandlers();
  }

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private setupEventHandlers(): void {
    // Vérification des mises à jour
    autoUpdater.on('checking-for-update', () => {
      log.info('Vérification des mises à jour...');
      this.sendStatusToWindow('Vérification des mises à jour...');
    });

    // Mise à jour disponible
    autoUpdater.on('update-available', (info) => {
      log.info('Mise à jour disponible:', info.version);
      this.updateAvailable = true;
      this.sendStatusToWindow('Mise à jour disponible!');
      
      // Notifier l'utilisateur
      this.showUpdateAvailableDialog(info);
    });

    // Pas de mise à jour
    autoUpdater.on('update-not-available', (info) => {
      log.info('Pas de mise à jour disponible');
      this.sendStatusToWindow('Application à jour');
    });

    // Erreur de mise à jour
    autoUpdater.on('error', (err) => {
      log.error('Erreur de mise à jour:', err);
      this.sendStatusToWindow(`Erreur: ${err.message}`);
    });

    // Téléchargement de la mise à jour
    autoUpdater.on('download-progress', (progressObj) => {
      let log_message = "Téléchargement: " + progressObj.percent + "%";
      log.info(log_message);
      this.sendStatusToWindow(log_message);
    });

    // Mise à jour téléchargée
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Mise à jour téléchargée');
      this.sendStatusToWindow('Mise à jour téléchargée');
      
      // Demander à l'utilisateur d'installer
      this.showUpdateDownloadedDialog();
    });
  }

  public checkForUpdates(): void {
    if (process.env.NODE_ENV === 'development') {
      log.info('Mode développement: vérification des mises à jour désactivée');
      return;
    }

    autoUpdater.checkForUpdatesAndNotify();
  }

  private showUpdateAvailableDialog(info: any): void {
    if (!this.mainWindow) return;

    const options = {
      type: 'info',
      title: 'Mise à jour disponible',
      message: `OpenSound ${info.version} est disponible!`,
      detail: `Version actuelle: ${app.getVersion()}\nNouvelle version: ${info.version}\n\nVoulez-vous télécharger la mise à jour maintenant?`,
      buttons: ['Oui', 'Non', 'Plus tard'],
      defaultId: 0
    };

    dialog.showMessageBox(this.mainWindow, options).then((result) => {
      if (result.response === 0) {
        // Oui - commencer le téléchargement
        autoUpdater.downloadUpdate();
      }
    });
  }

  private showUpdateDownloadedDialog(): void {
    if (!this.mainWindow) return;

    const options = {
      type: 'info',
      title: 'Mise à jour prête',
      message: 'La mise à jour a été téléchargée',
      detail: 'L\'application va redémarrer pour installer la mise à jour.',
      buttons: ['Redémarrer maintenant', 'Redémarrer plus tard'],
      defaultId: 0
    };

    dialog.showMessageBox(this.mainWindow, options).then((result) => {
      if (result.response === 0) {
        // Redémarrer et installer
        autoUpdater.quitAndInstall();
      }
    });
  }

  private sendStatusToWindow(text: string): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('updater-status', text);
    }
  }

  public isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }
}
