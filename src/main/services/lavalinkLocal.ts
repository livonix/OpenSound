import { spawn, ChildProcess } from 'child_process';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export class LavalinkLocalService {
  private lavalinkProcess: ChildProcess | null = null;
  private readonly port: number = 2333;
  private readonly host: string = 'localhost';
  private isStarting: boolean = false;
  private isReady: boolean = false;
  private startAttempts: number = 0;
  private readonly maxStartAttempts: number = 3;

  constructor() {
    // Nettoyer les processus au démarrage
    this.cleanupExistingProcesses();
  }

  private cleanupExistingProcesses(): void {
    try {
      // Tuer les processus Java existants sur le port 2333 (Windows)
      if (process.platform === 'win32') {
        spawn('taskkill', ['/F', '/IM', 'java.exe'], { stdio: 'ignore' });
      }
    } catch (error) {
      // Ignorer les erreurs
    }
  }

  public async startLavalink(): Promise<boolean> {
    if (this.isStarting || this.isReady) {
      console.log('Lavalink déjà en démarrage ou prêt');
      return this.isReady;
    }

    this.isStarting = true;
    this.startAttempts++;

    console.log(`🚀 Démarrage de Lavalink local (tentative ${this.startAttempts}/${this.maxStartAttempts})`);

    try {
      // Chemin vers le JAR Lavalink
      const jarPath = this.getLavalinkJarPath();
      
      if (!fs.existsSync(jarPath)) {
        console.error(`❌ Fichier Lavalink JAR non trouvé: ${jarPath}`);
        throw new Error('Lavalink JAR not found');
      }

      // Configuration Lavalink
      const configPath = await this.createLavalinkConfig();

      // Démarrer Lavalink
      const args = [
        '-jar', jarPath,
        '--config', configPath
      ];

      console.log(`📦 Lancement: java ${args.join(' ')}`);

      this.lavalinkProcess = spawn('java', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.dirname(jarPath)
      });

      // Logger la sortie
      this.lavalinkProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`[Lavalink] ${output.trim()}`);
        
        // Détecter quand Lavalink est prêt
        if (output.includes('Server started') || output.includes('Lavalink is ready')) {
          this.isReady = true;
          this.isStarting = false;
          console.log('✅ Lavalink local prêt!');
        }
      });

      this.lavalinkProcess.stderr?.on('data', (data) => {
        console.error(`[Lavalink Error] ${data.toString().trim()}`);
      });

      this.lavalinkProcess.on('close', (code) => {
        console.log(`Lavalink process terminé avec code: ${code}`);
        this.isReady = false;
        this.lavalinkProcess = null;

        // Réessayer si ça a échoué
        if (code !== 0 && this.startAttempts < this.maxStartAttempts) {
          console.log('🔄 Tentative de redémarrage de Lavalink...');
          setTimeout(() => this.startLavalink(), 2000);
        }
      });

      this.lavalinkProcess.on('error', (error) => {
        console.error('❌ Erreur Lavalink:', error);
        this.isStarting = false;
      });

      // Attendre que Lavalink soit prêt
      return await this.waitForReady();

    } catch (error) {
      console.error('❌ Erreur démarrage Lavalink:', error);
      this.isStarting = false;
      return false;
    }
  }

  private async waitForReady(): Promise<boolean> {
    const maxWaitTime = 30000; // 30 secondes max
    const checkInterval = 1000; // Vérifier chaque seconde
    let waitTime = 0;

    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.isReady) {
          resolve(true);
          return;
        }

        waitTime += checkInterval;
        if (waitTime >= maxWaitTime) {
          console.log('⏰ Timeout attente Lavalink');
          resolve(false);
          return;
        }

        setTimeout(checkReady, checkInterval);
      };

      checkReady();
    });
  }

  private getLavalinkJarPath(): string {
    // Chercher le JAR dans plusieurs emplacements possibles
    const possiblePaths = [
      path.join(process.resourcesPath, 'lavalink', 'Lavalink.jar'),
      path.join(__dirname, '../../assets/lavalink/Lavalink.jar'),
      path.join(__dirname, '../../../assets/lavalink/Lavalink.jar'),
      path.join(process.cwd(), 'assets/lavalink/Lavalink.jar'),
      path.join(process.cwd(), 'Lavalink.jar')
    ];

    for (const jarPath of possiblePaths) {
      if (fs.existsSync(jarPath)) {
        console.log(`📦 JAR Lavalink trouvé: ${jarPath}`);
        return jarPath;
      }
    }

    throw new Error('Lavalink JAR non trouvé');
  }

  private async createLavalinkConfig(): Promise<string> {
    const configPath = path.join(app.getPath('temp'), 'lavalink', 'application.yml');
    
    // Créer le dossier si nécessaire
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Configuration Lavalink
    const config = `
server:
  address: ${this.host}
  port: ${this.port}
  http2:
    enabled: false

lavalink:
  server:
    password: "youshallnotpass"
    sources:
      youtube: true
      bandcamp: false
      soundcloud: false
      twitch: false
      vimeo: false
      http: false
      local: false
    bufferDurationMs: 400
    frameBufferDurationMs: 5000
    opusEncodingQuality: 10
    resamplingQuality: LOW
    trackStuckThresholdMs: 10000
    useSeekGhosting: true
    youtubePlaylistLoadLimit: 6
    playerUpdateInterval: 5
    youtubeSearchEnabled: true
    soundcloudSearchEnabled: false
    gcWarnings: true

metrics:
  prometheus:
    enabled: false
    endpoint: /metrics

logging:
  level: INFO
  log:
    max-size: 100MB
    max-backups: 5
  request-log:
    enabled: true
    include-middleware: true

plugins:
  - {}
`;

    fs.writeFileSync(configPath, config);
    console.log(`📄 Configuration Lavalink créée: ${configPath}`);
    return configPath;
  }

  public async stopLavalink(): Promise<void> {
    if (this.lavalinkProcess) {
      console.log('🛑 Arrêt de Lavalink local...');
      
      this.lavalinkProcess.kill('SIGTERM');
      
      // Forcer l'arrêt après 5 secondes
      setTimeout(() => {
        if (this.lavalinkProcess && !this.lavalinkProcess.killed) {
          this.lavalinkProcess.kill('SIGKILL');
        }
      }, 5000);

      this.lavalinkProcess = null;
      this.isReady = false;
      this.isStarting = false;
    }
  }

  public isLavalinkReady(): boolean {
    return this.isReady;
  }

  public getLavalinkUrl(): string {
    return `http://${this.host}:${this.port}`;
  }

  public getLavalinkPassword(): string {
    return 'youshallnotpass';
  }
}
