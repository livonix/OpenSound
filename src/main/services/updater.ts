import { autoUpdater } from 'electron-updater';
import { app, dialog, BrowserWindow, shell } from 'electron';
import log from 'electron-log';

export class UpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private updateAvailable: boolean = false;

  constructor() {
    // Configuration du logger
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    // Forcer la vérification des mises à jour même en développement
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

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
    // Toujours utiliser la vérification manuelle pour éviter les restrictions de développement
    log.info('Vérification des mises à jour (mode manuel forcé)');
    this.checkForUpdatesManually();
  }

  private async checkForUpdatesManually(): Promise<void> {
    try {
      // Récupérer la dernière version depuis GitHub API
      const response = await fetch('https://api.github.com/repos/livonix/OpenSound/releases/latest');
      const release = await response.json() as { tag_name: string; name: string; html_url: string };
      
      const currentVersion = app.getVersion();
      const latestVersion = release.tag_name.replace('v', '');
      
      log.info(`Version actuelle: ${currentVersion}, Dernière version: ${latestVersion}`);
      
      // Comparer les versions (simple comparaison de chaînes)
      if (currentVersion !== latestVersion) {
        this.updateAvailable = true;
        this.showUpdateAvailableDialog({ version: latestVersion });
      } else {
        log.info('Application à jour');
        this.sendStatusToWindow('Application à jour');
      }
    } catch (error) {
      log.error('Erreur lors de la vérification manuelle des mises à jour:', error);
      this.sendStatusToWindow('Erreur lors de la vérification des mises à jour');
    }
  }

  private openGitHubRelease(): void {
    const releasesUrl = 'https://github.com/livonix/OpenSound/releases';
    log.info('Ouverture de la page des releases sur GitHub:', releasesUrl);
    
    // Ouvrir dans le navigateur par défaut
    shell.openExternal(releasesUrl);
    
    // Envoyer un message à la fenêtre principale
    this.sendStatusToWindow('Redirection vers GitHub pour télécharger la mise à jour...');
  }

  private showUpdateAvailableDialog(info: any): void {
    if (!this.mainWindow) return;

    const isDev = process.env.NODE_ENV === 'development';
    const options = {
      type: 'info' as const,
      title: 'Mise à jour disponible',
      message: `OpenSound ${info.version} est disponible!`,
      detail: `Version actuelle: ${app.getVersion()}\nNouvelle version: ${info.version}\n\n${isDev ? 'Mode développement detected.\n' : ''}Voulez-vous télécharger la mise à jour maintenant?`,
      buttons: isDev ? ['Ouvrir sur GitHub', 'Plus tard'] : ['Télécharger automatiquement', 'Ouvrir sur GitHub', 'Plus tard'],
      defaultId: 0
    };

    dialog.showMessageBox(this.mainWindow, options).then((result) => {
      if (isDev) {
        // En développement, seul l'option GitHub est disponible
        if (result.response === 0) {
          this.openGitHubRelease();
        }
      } else {
        // En production
        if (result.response === 0) {
          // Télécharger automatiquement
          autoUpdater.downloadUpdate();
        } else if (result.response === 1) {
          // Ouvrir sur GitHub
          this.openGitHubRelease();
        }
      }
    });
  }

  private showUpdateDownloadedDialog(): void {
    if (!this.mainWindow) return;

    const options = {
      type: 'info' as const,
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
