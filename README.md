# 🎵 OpenSound - Clone Spotify Open Source

![License](https://img.shields.io/github/license/livonix/OpenSound?style=for-the-badge)
![Version](https://img.shields.io/github/v/release/livonix/OpenSound?style=for-the-badge)
![Stars](https://img.shields.io/github/stars/livonix/OpenSound?style=for-the-badge)
![Forks](https://img.shields.io/github/forks/livonix/OpenSound?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=white&style=for-the-badge)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white&style=for-the-badge)

**OpenSound** est une application desktop open-source de streaming musical inspirée de Spotify. Elle permet d’écouter de la musique **gratuitement et instantanément** en utilisant des sources YouTube publiques avec un système de fallback intelligent.

> ⚠️ **Avertissement** : Cette application ne stocke ni n’héberge aucun contenu musical. Elle redirige uniquement vers des flux publics disponibles sur YouTube. Respectez les droits d’auteur.

![OpenSound Screenshot](https://via.placeholder.com/1200x600/1DB954/000000?text=OpenSound+Interface)

---

## 🚀 Lancer l'application
 
```bash
npm start
```

## 📋 Prérequis

- Node.js 20.0.0 ou supérieur
- npm ou pnpm
- yt-dlp (installé automatiquement)

## 🎯 Fonctionnalités Principales

### 🔍 **Recherche Musicale Avancée**
- **Multi-sources** : Piped API → Invidious → yt-dlp direct
- **Fallback intelligent** : Basculement automatique entre sources
- **Cache intelligent** : Résultats en cache pour performances optimales
- **Filtres avancés** : Recherche par titre, artiste, album

### 🎧 **Streaming Audio Haute Qualité**
- **Streaming direct** : URLs audio YouTube via ytdl-core + yt-dlp
- **Qualité audio** : Meilleur format audio disponible (128-320 kbps)
- **Buffering intelligent** : Préchargement pour lecture fluide
- **Cache streaming** : URLs en cache pour éviter les re-requêtes

### 📱 **Interface Utilisateur Moderne**
- **Design inspiré de Spotify** : Interface familière et intuitive
- **Responsive** : Adaptation desktop/tablette
- **Thèmes** : Mode clair/sombre
- **Animations fluides** : Transitions et micro-interactions

### 📚 **Gestion de Bibliothèque Complète**
- **Playlists** : Création et gestion de playlists personnalisées
- **Favoris** : Sauvegarde des titres préférés
- **Historique** : Consultation des écoutes récentes
- **Recommandations** : Suggestions basées sur les écoutes

## 🏗️ Architecture Technique

### **Stack Principal**
- **Frontend** : React 18 + TypeScript + Vite
- **Backend** : Electron (Node.js 20+) + TypeScript  
- **Styling** : TailwindCSS + shadcn/ui
- **Audio** : Web Audio API + ytdl-core + yt-dlp

### **Structure du Projet**
```
OpenSound/
├── src/
│   ├── main/           # Processus Electron principal
│   │   ├── services/   # Services métier (YouTube, Spotify, etc.)
│   │   ├── ipc/        # Handlers IPC
│   │   └── preload.ts  # Script preload
│   ├── renderer/       # Application React
│   │   ├── src/
│   │   │   ├── components/  # Composants UI
│   │   │   ├── pages/       # Pages (Library, Search, etc.)
│   │   │   └── hooks/       # Hooks React
│   └── shared/         # Types partagés
├── dist/               # Build compilation
└── package.json        # Dépendances
```

## 🔧 Services Principaux

### **YouTubeStreamingService**
- **Recherche multi-couches** : Piped API → Invidious → yt-dlp direct
- **Streaming robuste** : ytdl-core + fallback yt-dlp
- **Cache intelligent** : Recherche (10min) + Streaming (5min)
- **Gestion d'erreurs** : Fallbacks automatiques

### **PlaybackService**
- **Contrôle lecture** : play/pause/seek/volume
- **Buffering intelligent** : Préchargement pour lecture fluide
- **Gestion erreurs réseau** : Reconnexion automatique

### **CacheService**
- **Multi-niveaux** : Recherche + Streaming
- **Limitation taille** : 100MB maximum
- **TTL configurable** : Expiration automatique

## 🛡️ Sécurité & Légal

### **Conformité**
- **Pas d'hébergement** : Aucun contenu stocké sur nos serveurs
- **Sources publiques** : API YouTube officielles
- **Streaming direct** : Lecture depuis serveurs YouTube
- **Respect copyright** : Usage personnel uniquement

### **Sécurité**
- **Pas de tracking** : Aucune donnée utilisateur collectée
- **Open source** : Code transparent et vérifiable
- **Pas de telemetry** : Pas de télémétrie
- **Local only** : Tout fonctionne localement

## 🔄 Migration Lavalink → YouTube

### **Ancienne Architecture**
```
Lavalink (Java) → Audio streaming
⬇️
Problèmes : Java requis, lourd, maintenance complexe
```

### **Nouvelle Architecture**
```
Piped/Invidious/yt-dlp → Audio streaming direct
⬇️  
Avantages : Léger, rapide, pas de Java, plus fiable
```

### **Bénéfices**
- **🚀 Performance** : Démarrage 3x plus rapide
- **💰 Coûts** : Pas de serveur requis
- **🔧 Maintenance** : Plus simple à maintenir
- **🌐 Fiabilité** : Plusieurs sources de fallback

## 📊 Performance

### **Temps de Démarrage**
- **Avant** : ~15 secondes (Lavalink)
- **Après** : ~5 secondes (YouTube direct)

### **Recherche**
- **Latence** : <2 secondes
- **Résultats** : 15-20 titres par recherche
- **Cache hit** : ~80% (réutilisations)

### **Streaming**
- **Démarrage lecture** : <1 seconde
- **Qualité** : 128-320 kbps
- **Buffer** : 5-10 secondes préchargées

## 🎯 Roadmap

### **Court Terme (1-2 mois)**
- [ ] **Playlist avancées** : Partage, collaboration
- [ ] **Recommandations IA** : Algorithmes de suggestion
- [ ] **Mode offline** : Téléchargement pour écoute hors ligne
- [ ] **Podcasts** : Support podcasts YouTube

### **Moyen Terme (3-6 mois)**
- [ ] **Mobile** : Version iOS/Android (React Native)
- [ ] **Sync cloud** : Synchronisation multi-appareils
- [ ] **API publique** : API pour développeurs tiers
- [ ] **Extensions** : Navigateur, mobile

### **Long Terme (6-12 mois)**
- [ ] **Multi-sources** : SoundCloud, Bandcamp, etc.
- [ ] **Social** : Partage social, profils
- [ ] **Live** : Streaming live
- [ ] **Monétisation** : Option premium sans pub

## 🛠️ Développement

### **Scripts Disponibles**
```bash
# Mode développement
npm run dev

# Build production
npm run build

# Tests
npm test

# Lint
npm run lint

# Nettoyage cache
npm run clean
```

### **Configuration**
```bash
# Variables d'environnement
cp .env.example .env

# Éditer .env avec vos clés
nano .env
```

## 🤝 Contribution

Nous apprécions les contributions ! Voici comment vous pouvez aider :

1. **Fork** le repository
2. **Créer** une branche (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### **Guidelines**
- Respecter les conventions de code ESLint/Prettier
- Ajouter des tests pour les nouvelles fonctionnalités
- Documenter les changements dans CHANGELOG.md

## 📝 License

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **React** - Framework frontend
- **Electron** - Framework desktop
- **yt-dlp** - Extracteur YouTube
- **ytdl-core** - Streaming YouTube
- **TailwindCSS** - Framework CSS
- **shadcn/ui** - Composants UI

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/livonix/OpenSound/issues)
- **Discussions** : [GitHub Discussions](https://github.com/livonix/OpenSound/discussions)
- **Wiki** : [Documentation](https://github.com/livonix/OpenSound/wiki)

---

<div align="center">

**🎵 OpenSound - Musique gratuite, illimitée, respectueuse de la vie privée**

[![GitHub stars](https://img.shields.io/github/stars/livonix/OpenSound?style=social)](https://github.com/livonix/OpenSound/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/livonix/OpenSound?style=social)](https://github.com/livonix/OpenSound/network)
[![GitHub issues](https://img.shields.io/github/issues/livonix/OpenSound)](https://github.com/livonix/OpenSound/issues)

</div>
- [Releases](https://github.com/livonix/OpenSound/releases)