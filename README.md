# OpenSound

A desktop music streaming application that combines Spotify metadata with YouTube audio streams, built with Electron, React, and Node.js.

## Features

- **Spotify Integration**: Search tracks, albums, and artists using Spotify's metadata
- **YouTube Audio Streaming**: Stream audio from YouTube using yt-dlp
- **Modern UI**: Spotify-like interface built with React and Tailwind CSS
- **Local Caching**: Intelligent caching system for faster playback
- **Playlist Management**: Create and manage custom playlists
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Architecture

### Main Process (Node.js)
- Spotify API integration
- YouTube search and audio streaming
- Local caching with SQLite
- IPC communication handlers

### Renderer Process (React)
- Modern UI with Tailwind CSS
- State management with Zustand
- Type-safe communication with main process

### Streaming Pipeline
```
Spotify Metadata → YouTube Search → yt-dlp → Audio Buffer → HTML5 Audio Player
```

## Prerequisites

1. **Node.js** (v18 or higher)
2. **yt-dlp** - Install and ensure it's in your PATH
   ```bash
   # On Windows (using pip)
   pip install yt-dlp

   # On macOS
   brew install yt-dlp

   # On Linux
   sudo apt install yt-dlp
   ```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/OpenSound.git
   cd OpenSound
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install renderer dependencies:
   ```bash
   npm run postinstall
   ```

## Configuration

1. **Spotify API Credentials**:
   - Create a Spotify Developer account at [https://developer.spotify.com](https://developer.spotify.com)
   - Create a new app and get your Client ID and Client Secret
   - Set environment variables or update the config:
     ```bash
     export SPOTIFY_CLIENT_ID="your_client_id"
     export SPOTIFY_CLIENT_SECRET="your_client_secret"
     ```

2. **YouTube API Key** (Optional):
   - Create a YouTube Data API key at [https://console.developers.google.com](https://console.developers.google.com)
   - Set environment variable:
     ```bash
     export YOUTUBE_API_KEY="your_youtube_api_key"
     ```

## Development

### Start the Application

```bash
# Development mode
npm run dev

# Production build
npm run build

# Package for distribution
npm run dist
```

### Project Structure

```
OpenSound/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts           # Main entry point
│   │   ├── preload.ts          # Preload script
│   │   ├── ipc/               # IPC handlers
│   │   └── services/          # Core services
│   │       ├── spotify.ts     # Spotify API
│   │       ├── youtube.ts     # YouTube integration
│   │       ├── streamer.ts    # Audio streaming
│   │       ├── cache.ts       # Local caching
│   │       ├── playback.ts    # Playback management
│   │       └── playlist.ts    # Playlist management
│   ├── renderer/              # React frontend
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── pages/         # Page components
│   │   │   ├── stores/        # State management
│   │   │   ├── hooks/         # Custom hooks
│   │   │   └── App.tsx        # Main app component
│   │   └── package.json
│   └── shared/                # Shared types
│       └── types/
├── assets/                    # Static assets
└── dist/                      # Build output
```

## Usage

### Basic Playback

1. **Search for Music**: Use the search bar to find tracks, albums, or artists
2. **Play a Track**: Click on any track to start playback
3. **Create Playlists**: Build custom playlists from your favorite tracks
4. **Manage Library**: Organize your music collection in the library section

### Keyboard Shortcuts

- **Space**: Play/Pause
- **→**: Next Track
- **←**: Previous Track
- **↑/↓**: Volume Control
- **Ctrl+F**: Focus Search

## Security

- All yt-dlp commands are properly sanitized to prevent command injection
- Spotify credentials are stored securely using Electron's safe storage APIs
- No audio content is downloaded permanently - only streaming is used

## Performance

- **Startup Time**: Under 3 seconds
- **Playback Start**: Under 2 seconds with intelligent buffering
- **Memory Usage**: Optimized with circular buffer system
- **Cache Management**: LRU eviction with configurable size limits

## Troubleshooting

### Common Issues

1. **"yt-dlp not found"**
   - Ensure yt-dlp is installed and in your PATH
   - Try running `yt-dlp --version` in your terminal

2. **Spotify API errors**
   - Verify your Client ID and Secret are correct
   - Check your internet connection
   - Ensure your Spotify Developer app is properly configured

3. **No audio playback**
   - Check your system volume
   - Verify yt-dlp can access YouTube
   - Try a different track to isolate the issue

### Logs

- Development logs are shown in the developer console
- Production logs are saved to the user data directory
- Enable debug mode with `DEBUG=opensound:* npm run dev`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This application is for educational purposes only. It uses Spotify's public API for metadata and YouTube for audio streaming. Please respect the terms of service of both platforms.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-username/OpenSound/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/OpenSound/discussions)
- **Documentation**: [Wiki](https://github.com/your-username/OpenSound/wiki)

---

**Built with ❤️ using Electron, React, and modern web technologies**
