import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { Shoukaku } from 'shoukaku';
import { searchRoutes } from './routes/search';
import { playerRoutes } from './routes/player';
import { PlayerManager } from './services/PlayerManager';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Lavalink connection
let shoukaku: Shoukaku | null = null;

// Initialize Lavalink connection
const initLavalink = async () => {
  try {
    // For now, we'll use a simplified approach since we're using direct HTTP calls
    // The search routes are already working with direct HTTP calls to Lavalink
    shoukaku = null;
    console.log('Lavalink initialized (simplified mode - using direct HTTP calls)');
  } catch (error) {
    console.error('Failed to initialize Lavalink:', error);
  }
};

initLavalink();

// Player Manager
const playerManager = new PlayerManager(null, io);

// Routes
app.use('/api/search', searchRoutes(null));
app.use('/api/player', playerRoutes(playerManager));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle Lavalink connection events
console.log('Lavalink events disabled for now (using direct HTTP calls)');

export { app, shoukaku, playerManager };
