import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { RoomManager } from './game/RoomManager.js';
import { 
  ChatLimiter, 
  StrokeLimiter, 
  sanitizeChatMessage, 
  validateStrokeAction 
} from './game/AbuseProtection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e5 // 100KB max payload
});

app.use(cors());
app.use(express.json());

// Serve static frontend in production if built
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

const roomManager = new RoomManager(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    activeRooms: roomManager.getRoomCount(),
    activePlayers: roomManager.getTotalPlayerCount(),
    memoryUsage: process.memoryUsage()
  });
});

// Check if room exists
app.get('/api/rooms/:roomId', (req, res) => {
  const room = roomManager.getRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    id: room.id,
    playerCount: room.getActivePlayers().length,
    status: room.gameState.status
  });
});

// Fallback to client index.html for SPA routing
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.send('DoodleClash Server Running. Start Vite client for frontend or run `npm run build`.');
    }
  });
});

// Socket.IO real-time handlers
io.on('connection', (socket) => {
  // 1. Create Room
  socket.on('createRoom', ({ player }, callback) => {
    try {
      if (!player || !player.name) {
        return callback?.({ error: 'Invalid player details' });
      }

      const hostPlayer = {
        id: player.id || socket.id,
        sessionId: player.sessionId || socket.id,
        name: sanitizeChatMessage(player.name).slice(0, 20),
        avatar: player.avatar || 0,
        socketId: socket.id
      };

      const room = roomManager.createRoom(hostPlayer);
      socket.join(room.id);

      callback?.({
        success: true,
        roomId: room.id,
        player: hostPlayer,
        settings: {
          rounds: room.gameState.maxRounds,
          drawTime: room.gameState.drawTime,
          wordPreset: room.gameState.wordPreset,
          customWords: room.gameState.customWords
        }
      });

      room.gameState.broadcastState();
    } catch (err) {
      console.error('Error in createRoom:', err);
      callback?.({ error: 'Failed to create room' });
    }
  });

  // 2. Join Room
  socket.on('joinRoom', ({ roomId, player }, callback) => {
    try {
      if (!roomId || !player || !player.name) {
        return callback?.({ error: 'Invalid room or player details' });
      }

      const cleanPlayer = {
        id: player.id || socket.id,
        sessionId: player.sessionId || socket.id,
        name: sanitizeChatMessage(player.name).slice(0, 20),
        avatar: player.avatar || 0,
        socketId: socket.id
      };

      const result = roomManager.joinRoom(roomId, cleanPlayer);
      if (!result.success) {
        return callback?.({ error: result.error });
      }

      const room = result.room;
      socket.join(room.id);

      // Return current room state + active canvas history for mid-round joiners
      const currentCanvasHistory = room.gameState.drawingManager.getCurrentState();

      callback?.({
        success: true,
        roomId: room.id,
        player: cleanPlayer,
        isHost: room.hostId === cleanPlayer.id,
        settings: {
          rounds: room.gameState.maxRounds,
          drawTime: room.gameState.drawTime,
          wordPreset: room.gameState.wordPreset,
          customWords: room.gameState.customWords
        },
        gameState: {
          status: room.gameState.status,
          round: room.gameState.currentRound,
          maxRounds: room.gameState.maxRounds,
          timeLeft: room.gameState.timeLeft,
          scores: room.getScores(),
          blanks: room.gameState.getBlanks()
        },
        canvasHistory: currentCanvasHistory
      });

      // Broadcast join notice
      socket.to(room.id).emit('chatMessage', {
        id: 'sys-' + Date.now(),
        sender: 'System',
        text: `${cleanPlayer.name} joined the room!`,
        isSystem: true
      });

      room.gameState.broadcastState();
    } catch (err) {
      console.error('Error in joinRoom:', err);
      callback?.({ error: 'Failed to join room' });
    }
  });

  // 3. Update Settings (Host only)
  socket.on('updateSettings', ({ settings }) => {
    const mapping = roomManager.socketToRoom.get(socket.id);
    if (!mapping) return;
    const room = roomManager.getRoom(mapping.roomId);
    if (!room || room.hostId !== mapping.playerId) return;

    room.gameState.updateSettings(settings);
    io.to(room.id).emit('settingsUpdated', {
      rounds: room.gameState.maxRounds,
      drawTime: room.gameState.drawTime,
      wordPreset: room.gameState.wordPreset,
      customWords: room.gameState.customWords
    });
  });

  // 4. Start Game (Host only)
  socket.on('startGame', () => {
    const mapping = roomManager.socketToRoom.get(socket.id);
    if (!mapping) return;
    const room = roomManager.getRoom(mapping.roomId);
    if (!room || room.hostId !== mapping.playerId) return;

    room.gameState.startGame();
  });

  // 4b. Return to Room Lobby (Host only)
  socket.on('returnToLobby', () => {
    const mapping = roomManager.socketToRoom.get(socket.id);
    if (!mapping) return;
    const room = roomManager.getRoom(mapping.roomId);
    if (!room || room.hostId !== mapping.playerId) return;

    room.gameState.resetToLobby();
  });

  // 4c. Player Leaves Room
  socket.on('leaveRoom', () => {
    const mapping = roomManager.socketToRoom.get(socket.id);
    if (!mapping) return;
    const { roomId, playerId } = mapping;
    socket.leave(roomId);
    roomManager.socketToRoom.delete(socket.id);
    const room = roomManager.getRoom(roomId);
    if (room) {
      room.removePlayerPermanently(playerId);
    }
  });

  // 5. Drawer chooses word
  socket.on('selectWord', ({ word }) => {
    const mapping = roomManager.socketToRoom.get(socket.id);
    if (!mapping) return;
    const room = roomManager.getRoom(mapping.roomId);
    if (!room || room.gameState.currentDrawerId !== mapping.playerId) return;

    room.gameState.selectWord(word);
  });

  // 6. Real-time Drawing Actions (Stroke, Fill, Clear, Undo)
  socket.on('drawAction', (action) => {
    const mapping = roomManager.socketToRoom.get(socket.id);
    if (!mapping) return;
    const room = roomManager.getRoom(mapping.roomId);
    if (!room || room.gameState.currentDrawerId !== mapping.playerId) return;

    // Rate limiting abuse protection
    if (!StrokeLimiter.isAllowed(socket.id)) {
      return;
    }

    const validatedAction = validateStrokeAction(action);
    if (!validatedAction) return;

    // Save in turn history & end-of-game replay
    const result = room.gameState.drawingManager.addAction(validatedAction);

    // Stream immediately to all other players in the room
    if (result.type === 'undo') {
      io.to(room.id).emit('drawAction', {
        type: 'undo',
        history: room.gameState.drawingManager.getCurrentState()
      });
    } else {
      socket.to(room.id).emit('drawAction', validatedAction);
    }
  });

  // 7. Chat & Guess Handling
  socket.on('chatMessage', ({ text }) => {
    const mapping = roomManager.socketToRoom.get(socket.id);
    if (!mapping) return;
    const room = roomManager.getRoom(mapping.roomId);
    if (!room) return;

    const player = room.getPlayer(mapping.playerId);
    if (!player) return;

    // Abuse Protection: Rate limit check
    if (!ChatLimiter.isAllowed(socket.id)) {
      socket.emit('chatMessage', {
        id: 'sys-' + Date.now(),
        sender: 'System',
        text: 'You are chatting too fast! Please slow down.',
        isSystem: true,
        isWarning: true
      });
      return;
    }

    const cleanText = sanitizeChatMessage(text);
    if (!cleanText) return;

    const guessResult = room.gameState.handleGuess(player, cleanText);

    if (guessResult.alreadyGuessed) {
      // Send chat message only to other players who have already guessed and the drawer
      for (const p of room.players.values()) {
        if (room.gameState.guessedPlayerIds.has(p.id) || p.id === room.gameState.currentDrawerId) {
          const s = io.sockets.sockets.get(p.socketId);
          if (s) {
            s.emit('chatMessage', {
              id: 'chat-' + Date.now() + '-' + Math.random(),
              sender: player.name,
              text: cleanText,
              isGuessedChat: true
            });
          }
        }
      }
      return;
    }

    if (guessResult.isCorrect) {
      // Don't show the word in chat; playerGuessedCorrect is already broadcast!
      return;
    }

    // Normal chat message broadcast
    if (guessResult.displayInChat) {
      io.to(room.id).emit('chatMessage', {
        id: 'chat-' + Date.now() + '-' + Math.random(),
        sender: player.name,
        text: cleanText
      });
    }
  });

  // 8. Disconnect handling (with 30-sec grace window)
  socket.on('disconnect', () => {
    ChatLimiter.remove(socket.id);
    StrokeLimiter.remove(socket.id);
    roomManager.handleSocketDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 DoodleClash Server listening on port ${PORT}`);
  console.log(`📡 WebSocket ready with reconnect window & rate limiting`);
});
