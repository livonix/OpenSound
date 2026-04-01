# Lavalink + YouTube-Source Setup

## Overview

This setup uses Lavalink with the youtube-source plugin to provide robust YouTube streaming capabilities. The youtube-source plugin is a modern replacement for LavaPlayer's deprecated YouTube source manager.

## Setup Instructions

### 1. Download Required Files

1. **Download Lavalink.jar** from: https://github.com/freyacodes/Lavalink/releases
   - Get the latest `Lavalink.jar` file
   - Place it in the root `OpenSound` directory

2. **YouTube Source Plugin** (already provided):
   - `youtube-plugin-1.18.0.jar` should be in the root directory

### 2. Start Lavalink

Run the batch file to start Lavalink with the YouTube plugin:

```bash
npm run lavalink
```

Or start both Lavalink and the app together:

```bash
npm run dev:lavalink
```

### 3. Configuration

The Lavalink configuration is in `lavalink/application.yml`:

- **Server**: `localhost:2333` with password `youshallnotpass`
- **YouTube Source**: Enabled with multiple clients (WEB, WEBEMBEDDED, ANDROID_VR, MUSIC)
- **Fallback**: If one client fails, another tries automatically

### 4. Features

#### Multiple InnerTube Clients
- **WEB**: Full support + livestreams
- **WEBEMBEDDED**: Limited age-restriction support
- **ANDROID_VR**: Livestream support
- **MUSIC**: YouTube Music search

#### Advanced Features (Optional)
- **OAuth Support**: Use real YouTube accounts to bypass restrictions
- **poToken Support**: Bypass bot detection with proof-of-origin tokens
- **Remote Cipher Server**: Handle signature decryption remotely

### 5. Usage in OpenSound

The app automatically uses the YouTube Lavalink service for:
- **YouTube Search**: `ytsearch:query` via youtube-source
- **Stream Extraction**: Direct streaming URLs from youtube-source
- **Fallback Handling**: Multiple clients for reliability

### 6. Troubleshooting

#### Lavalink Won't Start
- Ensure Java 11+ is installed
- Check that `Lavalink.jar` exists in root directory
- Verify `youtube-plugin-1.18.0.jar` is present

#### YouTube Streaming Fails
- Check Lavalink logs for client errors
- Try enabling OAuth if getting bot detection
- Consider using poToken for better bypass

#### Connection Issues
- Verify Lavalink is running on `localhost:2333`
- Check firewall isn't blocking the connection
- Ensure password matches (`youshallnotpass`)

### 7. Advanced Configuration

#### OAuth Setup
```yaml
plugins:
  youtube:
    oauth:
      enabled: true
      refreshToken: "your_refresh_token"
```

#### poToken Setup
```yaml
plugins:
  youtube:
    pot:
      token: "your_po_token"
      visitorData: "your_visitor_data"
```

### 8. API Endpoints

The YouTube source plugin provides REST endpoints:

- `GET /youtube/stream/{videoId}` - Get streaming URL
- `GET /youtube` - Get current configuration
- `POST /youtube` - Update configuration
- `GET /youtube/oauth/{refreshToken}` - OAuth token refresh

### 9. Benefits

✅ **More Reliable**: Multiple clients with automatic fallback  
✅ **Always Updated**: Follows YouTube changes in real-time  
✅ **Professional Grade**: Used by major Discord music bots  
✅ **Advanced Features**: OAuth, poToken, remote cipher support  
✅ **REST API**: Easy integration with any language  

This setup provides the most robust and future-proof YouTube streaming solution available.
