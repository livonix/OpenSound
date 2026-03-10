# OpenSound - Application Desktop Electron

Une application desktop de streaming musical open source avec interface type Spotify, utilisant Lavalink pour la recherche et la lecture de musique. Disponible en version Windows avec système de mise à jour automatique.

## 🎵 Fonctionnalités

- 🖥️ **Application Desktop Windows** avec Electron
- 🔄 **Mises à jour automatiques** via GitHub
- 🎵 **Recherche de musique** via Lavalink (YouTube, SoundCloud, etc.)
- 🎨 **Interface moderne** inspirée de Spotify
- 🚀 **Flux Lavalink direct** (plus de proxy/ytdl)
- 🎧 **Lecteur audio** avec contrôles complets
- 📱 **Design responsive** et intuitif
- 🌍 **Streaming gratuit** et open source
- 📚 **Gestion de playlists** locale
- ⚙️ **Paramètres avancés** avec gestion du cache

## 🏗️ Architecture

### Application Electron
- **Electron 27** avec Node.js intégré
- **Système de mise à jour** automatique via GitHub
- **Flux Lavalink direct** sans intermédiaire
- **Backend intégré** pour la persistance

### Frontend (TypeScript + React)
- React 18 avec TypeScript
- Tailwind CSS pour le style
- React Router pour la navigation
- Lucide React pour les icônes

### Backend (Node.js + TypeScript)
- Express.js pour l'API REST
- Socket.IO pour la communication temps réel
- Moteur de recommandations intelligent
- Gestion des playlists locales

### Lavalink
- Serveur Lavalink pour le streaming audio
- Support YouTube, SoundCloud, Spotify, Apple Music
- Configuration optimisée pour desktop

## 📦 Installation

### Prérequis
- Windows 10/11 (x64 ou x86)
- Java 17+ (inclus dans l'installateur)

### Installation via l'installateur

1. **Télécharger la dernière version**
   - Allez sur la [page des releases](https://github.com/your-username/OpenSound/releases)
   - Téléchargez `OpenSound-Setup-x.x.x.exe`

2. **Lancer l'installateur**
   - Double-cliquez sur le fichier `.exe`
   - Suivez les instructions d'installation
   - Choisissez le dossier d'installation (par défaut: `Program Files\OpenSound`)

3. **Lancer l'application**
   - Raccourci créé sur le bureau et dans le menu Démarrer
   - L'application démarre automatiquement Lavalink et le backend

### Installation depuis les sources

1. **Cloner le projet**
```bash
git clone https://github.com/your-username/OpenSound.git
cd OpenSound
```

2. **Installer les dépendances**
```bash
npm install
npm run install:all
```

3. **Builder l'application**
```bash
npm run build
npm run electron-build
```

4. **Lancer en développement**
```bash
npm run electron-dev
```

## 🎮 Utilisation

### Interface Desktop
1. **Lancement automatique** des services backend et Lavalink
2. **Recherche instantanée** via la barre de recherche
3. **Lecture directe** avec flux Lavalink optimisé
4. **Playlists personnalisées** avec gestion locale
5. **Paramètres avancés** pour gérer le cache et les préférences

### Mises à jour automatiques
- **Vérification automatique** au démarrage
- **Notification** quand une mise à jour est disponible
- **Téléchargement silencieux** en arrière-plan
- **Installation en un clic** avec redémarrage

## ⚙️ Configuration

### Variables d'environnement
Le fichier `backend/.env` contient la configuration:
```env
PORT=3001
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
NODE_ENV=production
```

### Configuration Lavalink
Le fichier `lavalink/application.yml` est préconfiguré:
- Port: 2333
- Password: youshallnotpass
- Sources: YouTube, SoundCloud, Spotify, etc.

## 🔧 Développement

### Scripts disponibles
```bash
# Développement
npm run electron-dev          # Lance Electron avec backend
npm run dev:backend          # Backend uniquement
npm run dev:frontend         # Frontend web (debug)

# Build
npm run build                # Build frontend
npm run electron-build       # Build Electron
npm run build-win            # Build Windows uniquement
npm run build-all            # Build toutes architectures

# Publication
npm run publish              # Publie sur GitHub
```

### Structure du projet

```
OpenSound/
├── electron/                # Fichiers Electron
│   ├── main.js             # Processus principal
│   ├── preload.js          # Script de préchargement
│   └── installer.nsh       # Script NSIS personnalisé
├── backend/                # Backend Node.js
│   ├── src/
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Services métier
│   │   └── index.ts        # Point d'entrée
│   └── application.yml     # Config Lavalink
├── frontend/               # Frontend React
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── contexts/       # Contextes React
│   │   ├── services/       # Services API
│   │   └── types/          # Types TypeScript
├── lavalink/              # Serveur Lavalink
└── electron-package.json  # Configuration Electron Builder
```

## 🚀 Publication

### Configuration GitHub
1. **Créer un token** GitHub avec permissions de repository
2. **Configurer** `GH_TOKEN` dans les variables d'environnement
3. **Publier** avec `npm run publish`

### Processus de publication
1. **Build** automatique de l'application
2. **Création** de la release GitHub
3. **Upload** des installateurs Windows
4. **Publication** des métadonnées de mise à jour

## 🐛 Dépannage

### Problèmes courants
- **Lavalink ne démarre pas**: Vérifiez que Java 17+ est installé
- **Audio ne joue pas**: Vérifiez la connexion internet et les pare-feux
- **Mise à jour échoue**: Redémarrez l'application en administrateur

### Logs et debug
- **Logs backend**: `backend/logs/`
- **Logs Electron**: Console de développement (F12)
- **Logs Lavalink**: Affichés dans la console

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche feature
3. Commit vos changements
4. Push vers la branche
5. Créer une Pull Request

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## 🙏 Remerciements

- **Electron** pour la framework desktop
- **Lavalink** pour le moteur de streaming audio
- **React et Tailwind CSS** pour le frontend
- **Spotify** pour l'inspiration du design
- **GitHub** pour l'hébergement et les mises à jour
