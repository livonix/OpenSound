# 🎵 OpenSound - Clone Spotify Open Source

![License](https://img.shields.io/github/license/livonix/OpenSound?style=for-the-badge)
![Version](https://img.shields.io/github/v/release/livonix/OpenSound?style=for-the-badge)
![Stars](https://img.shields.io/github/stars/livonix/OpenSound?style=for-the-badge)
![Forks](https://img.shields.io/github/forks/livonix/OpenSound?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=white&style=for-the-badge)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white&style=for-the-badge)

**OpenSound** is an open-source desktop music streaming application inspired by Spotify. It allows you to listen to music **freely and instantly** using public YouTube sources with an intelligent fallback system.

> ⚠️ **Disclaimer** : This application does not store or host any musical content. It only redirects to public streams available on YouTube. Respect copyright.

![OpenSound Screenshot](https://i.ibb.co/zT7VJKYp/opensound.jpg)

---

## 🚀 Run the Application

```bash
npm start
```

## 📋 Prerequisites

- Node.js 20.0.0 or higher
- npm or pnpm
- yt-dlp (automatically installed)

## 🎯 Key Features

### 🔍 **Advanced Music Search**
- **Multi-sources** : Piped API → Invidious → yt-dlp direct
- **Smart fallback** : Automatic switching between sources
- **Intelligent cache** : Cached results for optimal performance
- **Advanced filters** : Search by title, artist, album

### 🎧 **High-Quality Audio Streaming**
- **Direct streaming** : YouTube audio URLs via ytdl-core + yt-dlp
- **Audio quality** : Best available audio format (128-320 kbps)
- **Smart buffering** : Preloading for smooth playback
- **Streaming cache** : Cached URLs to avoid re-requests

### 📱 **Modern User Interface**
- **Spotify-inspired design** : Familiar and intuitive interface
- **Responsive** : Desktop/tablet adaptation
- **Themes** : Light/dark mode
- **Smooth animations** : Transitions and micro-interactions

### 📚 **Complete Library Management**
- **Playlists** : Create and manage custom playlists
- **Favorites** : Save preferred tracks
- **History** : View recent listens
- **Recommendations** : Suggestions based on listening habits

## 🏗️ Technical Architecture

### **Main Stack**
- **Frontend** : React 18 + TypeScript + Vite
- **Backend** : Electron (Node.js 20+) + TypeScript  
- **Styling** : TailwindCSS + shadcn/ui
- **Audio** : Web Audio API + ytdl-core + yt-dlp

### **Project Structure**
```
OpenSound/
├── src/
│   ├── main/           # Main Electron process
│   │   ├── services/   # Business services (YouTube, Spotify, etc.)
│   │   ├── ipc/        # IPC handlers
│   │   └── preload.ts  # Preload script
│   ├── renderer/       # React application
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── pages/       # Pages (Library, Search, etc.)
│   │   │   └── hooks/       # React hooks
│   └── shared/         # Shared types
├── dist/               # Build compilation
└── package.json        # Dependencies
```

## 🔧 Main Services

### **YouTubeStreamingService**
- **Multi-layer search** : Piped API → Invidious → yt-dlp direct
- **Robust streaming** : ytdl-core + fallback yt-dlp
- **Intelligent cache** : Search (10min) + Streaming (5min)
- **Error management** : Automatic fallbacks

### **PlaybackService**
- **Playback control** : play/pause/seek/volume
- **Smart buffering** : Preloading for smooth playback
- **Network error management** : Automatic reconnection

### **CacheService**
- **Multi-level** : Search + Streaming
- **Size limitation** : 100MB maximum
- **Configurable TTL** : Automatic expiration

## 🛡️ Security & Legal

### **Compliance**
- **No hosting** : No content stored on our servers
- **Public sources** : Official YouTube APIs
- **Direct streaming** : Playback from YouTube servers
- **Copyright respect** : Personal use only

### **Security**
- **No tracking** : No user data collected
- **Open source** : Transparent and verifiable code
- **No telemetry** : No telemetry
- **Local only** : Everything works locally

## 🔄 Migration Lavalink → YouTube

### **Old Architecture**
```
Lavalink (Java) → Audio streaming
⬇️
Issues : Java required, heavy, complex maintenance
```

### **New Architecture**
```
Piped/Invidious/yt-dlp → Direct audio streaming
⬇️  
Advantages : Lightweight, fast, no Java, more reliable
```

### **Benefits**
- **🚀 Performance** : 3x faster startup
- **💰 Costs** : No server required
- **🔧 Maintenance** : Easier to maintain
- **🌐 Reliability** : Multiple fallback sources

## 📊 Performance

### **Startup Time**
- **Before** : ~15 seconds (Lavalink)
- **After** : ~5 seconds (YouTube direct)

### **Search**
- **Latency** : <2 seconds
- **Results** : 15-20 tracks per search
- **Cache hit** : ~80% (reuses)

### Streaming
- **Playback start** : <1 second
- **Quality** : 128-320 kbps
- **Buffer** : 5-10 seconds preloaded

## 🎯 Roadmap

### Short Term (1-2 months)
- [ ] **Advanced playlists** : Sharing, collaboration
- [ ] **AI recommendations** : Suggestion algorithms
- [ ] **Offline mode** : Downloads for offline listening
- [ ] **Podcasts** : YouTube podcasts support

### Medium Term (3-6 months)
- [ ] **Mobile** : iOS/Android version (React Native)
- [ ] **Cloud sync** : Multi-device synchronization
- [ ] **Public API** : Third-party developer API
- [ ] **Extensions** : Browser, mobile extensions

### Long Term (6-12 months)
- [ ] **Multi-sources** : SoundCloud, Bandcamp, etc.
- [ ] **Social** : Social sharing, profiles
- [ ] **Live** : Live streaming

## 🛠️ Development

### Available Scripts
```bash
# Development mode
npm run dev

# Production build
npm run build

# Tests
npm test

# Lint
npm run lint

# Cache cleanup
npm run clean
```

### Configuration
```bash
# Environment variables
cp .env.example .env

# Edit .env with your keys
nano .env
```

## 🤝 Contribution

We appreciate contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Guidelines
- Follow ESLint/Prettier code conventions
- Add tests for new features
- Document changes in CHANGELOG.md

## 📝 License

This project is licensed under MIT - see the [LICENSE](LICENSE) file for more details.

## 🙏 Acknowledgments

- **React** - Frontend framework
- **Electron** - Desktop framework
- **yt-dlp** - YouTube extractor
- **ytdl-core** - YouTube streaming
- **TailwindCSS** - CSS framework
- **shadcn/ui** - UI components

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/livonix/OpenSound/issues)
- **Discussions** : [GitHub Discussions](https://github.com/livonix/OpenSound/discussions)
- **Wiki** : [Documentation](https://github.com/livonix/OpenSound/wiki)

---

<div align="center">

**🎵 OpenSound - Free, unlimited, privacy-respecting music**

[![GitHub stars](https://img.shields.io/github/stars/livonix/OpenSound?style=social)](https://github.com/livonix/OpenSound/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/livonix/OpenSound?style=social)](https://github.com/livonix/OpenSound/network)
[![GitHub issues](https://img.shields.io/github/issues/livonix/OpenSound)](https://github.com/livonix/OpenSound/issues)

</div>
- [Releases](https://github.com/livonix/OpenSound/releases)