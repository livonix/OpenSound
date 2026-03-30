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

## ✨ Fonctionnalités

- 🔍 **Recherche intelligente** par titre, artiste, album
- 🎧 **Streaming direct** sans téléchargement complet (vrai streaming progressif)
- 🔄 **Système de fallback robuste** : Piped API → Invidious → yt-dlp
- 📚 **Bibliothèque complète** : Playlists, Favoris, Historique
- 🌙 **Interface moderne** inspirée de Spotify (mode clair/sombre)
- 💾 **Cache intelligent** pour des performances optimales
- 🛠️ **Multi-plateforme** : Windows, macOS et Linux

---

## 🏗️ Architecture Technique

### Stack Principale
- **Frontend** : React 18 + TypeScript + Vite
- **Backend** : Electron + Node.js + TypeScript
- **Styling** : Tailwind CSS + shadcn/ui
- **Streaming Audio** : yt-dlp (recommandé) + Web Audio API
- **Stockage local** : electron-store

### Structure du projet
```bash
OpenSound/
├── src/
│   ├── main/                 # Processus Electron principal
│   │   ├── services/         # YouTubeStreamingService, PlaybackService, CacheService
│   │   ├── ipc/              # Handlers IPC
│   │   └── preload.ts
│   ├── renderer/             # Application React
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   └── shared/               # Types et utilitaires partagés
├── dist/                     # Builds compilés
└── package.json
```

---

## 🚀 Installation & Développement

### Prérequis
- Node.js 20 ou supérieur
- pnpm (recommandé) ou npm

### Commandes

```bash
# Cloner le projet
git clone https://github.com/livonix/OpenSound.git
cd opensound

# Installer les dépendances
pnpm install

# Développement
pnpm run dev

# Build production
pnpm run build

# Lancer la version compilée
pnpm run start
```

### Scripts disponibles

| Commande           | Description                              |
|--------------------|------------------------------------------|
| `pnpm run dev`     | Mode développement (Vite + Electron)     |
| `pnpm run build`   | Compilation pour production              |
| `pnpm run start`   | Lancer l'application compilée            |
| `pnpm run lint`    | Vérification du code                     |

---

## 🔧 Services Principaux

### 1. YouTubeStreamingService
```typescript
// Recherche avec fallback intelligent
Piped API → Invidious → yt-dlp direct
```

### 2. PlaybackService
- Lecture / Pause / Seek / Volume
- Buffering intelligent
- Préchargement du titre suivant

### 3. CacheService
- Cache des résultats de recherche (TTL 10 min)
- Cache des URLs de streaming (TTL selon expiration YouTube)

---

## 🛡️ Sécurité & Aspects Légaux

- Aucun contenu musical n’est stocké sur l’appareil (sauf cache temporaire)
- Streaming direct depuis les serveurs YouTube
- Aucune collecte de données ni télémétrie
- Code entièrement open source et auditable
- Usage personnel uniquement recommandé

> **Note importante** : Les instances Piped et Invidious peuvent être instables. Le fallback yt-dlp assure une meilleure fiabilité.

---

## 📊 Performance

- **Démarrage de l’application** : ~5 secondes
- **Latence de recherche** : < 2 secondes (avec cache)
- **Démarrage de la lecture** : < 1 seconde
- **Qualité audio** : jusqu’à 320 kbps (Opus / AAC)

---

## 🛣️ Roadmap

### Court terme (1-2 mois)
- [ ] Mode hors-ligne amélioré (cache persistant)
- [ ] Gestion avancée des playlists
- [ ] Meilleure gestion des erreurs réseau

### Moyen terme (3-6 mois)
- [ ] Support SoundCloud et Bandcamp via plugins
- [ ] Version mobile (React Native ou Tauri)
- [ ] Recommandations basées sur l’historique

### Long terme
- [ ] Synchronisation multi-appareils
- [ ] Extensions navigateur
- [ ] Version web (PWA)

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Crée ta branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit tes changements (`git commit -m 'Ajout d’une super fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvre une Pull Request

---

## 📝 Licence

Ce projet est distribué sous la licence **MIT**.  
Voir le fichier [`LICENSE`](LICENSE) pour plus de détails.

---

**Made with ❤️ pour les amoureux de musique**

Si OpenSound vous plaît, n’hésitez pas à mettre une ⭐ sur le repository !

---

**Liens utiles**
- [Signaler un bug](https://github.com/livonix/OpenSound/issues)
- [Discussions](https://github.com/livonix/OpenSound/discussions)
- [Releases](https://github.com/livonix/OpenSound/releases)