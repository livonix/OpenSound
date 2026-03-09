# OpenSound - Spotify Clone Open Source

Une application web de streaming musical open source avec interface type Spotify, utilisant Lavalink pour la recherche et la lecture de musique.

## Fonctionnalités

- 🎵 **Recherche de musique** via Lavalink (YouTube, SoundCloud, etc.)
- 🎨 **Interface moderne** inspirée de Spotify
- 🚀 **Frontend TypeScript** avec React et Tailwind CSS
- ⚡ **Backend Node.js** avec Express et Socket.IO
- 🎧 **Lecteur audio** avec contrôles complets
- 📱 **Design responsive** pour tous les appareils
- 🌍 **Streaming gratuit** et open source

## Architecture

### Frontend (TypeScript + React)
- React 18 avec TypeScript
- Tailwind CSS pour le style
- React Router pour la navigation
- Socket.IO Client pour la communication temps réel
- Lucide React pour les icônes

### Backend (Node.js + TypeScript)
- Express.js pour l'API REST
- Socket.IO pour la communication temps réel
- Shoukaku pour l'intégration Lavalink
- Axios pour les requêtes HTTP

### Lavalink
- Serveur Lavalink pour le streaming audio
- Support YouTube, SoundCloud, Spotify, Apple Music
- Configuration personnalisée

## Installation

### Prérequis
- Node.js 18+
- Java 17+ (pour Lavalink)
- npm ou yarn

### Étapes d'installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd OpenSound
```

2. **Installer les dépendances**
```bash
npm run install:all
```

3. **Configurer Lavalink**
```bash
cd backend
# Copier le fichier Lavalink.jar depuis Template/
# Le fichier application.yml est déjà configuré
```

4. **Démarrer Lavalink** (dans un terminal séparé)
```bash
cd backend
java -jar Lavalink.jar
```

5. **Démarrer l'application**
```bash
# Retour à la racine
cd ..
npm run dev
```

## Utilisation

1. Ouvrez votre navigateur sur `http://localhost:3000`
2. Utilisez la barre de recherche pour trouver des musiques
3. Cliquez sur le bouton play pour écouter
4. Utilisez le lecteur en bas pour contrôler la lecture

## Configuration

### Variables d'environnement (Backend)
Créez un fichier `.env` dans `backend/`:
```env
PORT=3001
LAVALINK_HOST=localhost
LAVALINK_PORT=2333
LAVALINK_PASSWORD=youshallnotpass
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Configuration Lavalink
Le fichier `backend/application.yml` contient la configuration Lavalink:
- Port: 2333
- Password: youshallnotpass
- Sources activées: YouTube, SoundCloud, Spotify, etc.

## API Endpoints

### Recherche
- `GET /api/search/tracks?query=<text>&source=<source>` - Rechercher des titres
- `GET /api/search/track/:identifier` - Détails d'un titre

### Lecteur
- `POST /api/player/play` - Lire un titre
- `POST /api/player/pause` - Mettre en pause
- `POST /api/player/stop` - Arrêter la lecture
- `POST /api/player/volume` - Régler le volume
- `POST /api/player/seek` - Se déplacer dans le titre
- `GET /api/player/state` - État du lecteur

## Structure du projet

```
OpenSound/
├── backend/                 # Backend Node.js
│   ├── src/
│   │   ├── routes/         # Routes API
│   │   ├── services/       # Services métier
│   │   └── index.ts        # Point d'entrée
│   ├── application.yml     # Config Lavalink
│   └── package.json
├── frontend/               # Frontend React
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── contexts/       # Contextes React
│   │   ├── services/       # Services API
│   │   └── types/          # Types TypeScript
│   └── package.json
├── Template/               # Template Lavalink existant
└── README.md
```

## Développement

### Scripts disponibles
- `npm run dev` - Démarrer frontend et backend en développement
- `npm run dev:backend` - Backend uniquement
- `npm run dev:frontend` - Frontend uniquement
- `npm run build` - Builder pour production
- `npm run start` - Démarrer en production

### Contribuer
1. Fork le projet
2. Créer une branche feature
3. Commit vos changements
4. Push vers la branche
5. Créer une Pull Request

## Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## Remerciements

- Lavalink pour le moteur de streaming audio
- Shoukaku pour le client Node.js
- React et Tailwind CSS pour le frontend
- Spotify pour l'inspiration du design
db7f761161c1484e4accee3a7f6d1ef3