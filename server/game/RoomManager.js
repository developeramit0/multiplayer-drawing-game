import { GameState, GAME_STATUS } from './GameState.js';

export class Room {
  constructor(id, hostPlayer, io) {
    this.id = id;
    this.io = io;
    this.hostId = hostPlayer.id;
    this.players = new Map(); // playerId -> Player
    this.disconnectTimers = new Map(); // playerId -> Timeout
    this.createdAt = Date.now();

    this.gameState = new GameState(this, io);
    this.addPlayer(hostPlayer);
  }

  addPlayer(player) {
    this.players.set(player.id, {
      ...player,
      score: player.score || 0,
      isDisconnected: false,
      joinedAt: Date.now()
    });
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  getActivePlayers() {
    return Array.from(this.players.values()).filter(p => !p.isDisconnected);
  }

  getScores() {
    return Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: p.score || 0,
      isHost: p.id === this.hostId,
      isDisconnected: p.isDisconnected
    })).sort((a, b) => b.score - a.score);
  }

  handleDisconnect(playerId, socketId) {
    const player = this.players.get(playerId);
    if (!player) return;

    player.isDisconnected = true;
    player.disconnectedAt = Date.now();

    // Check if this player was the active drawer
    if (this.gameState.status === GAME_STATUS.DRAWING || 
        this.gameState.status === GAME_STATUS.CHOOSING_WORD) {
      if (this.gameState.currentDrawerId === playerId) {
        this.gameState.handleDrawerDisconnect(playerId);
      }
    }

    // Broadcast temporary disconnect notice
    this.io.to(this.id).emit('playerDisconnectedNotice', {
      playerId: player.id,
      playerName: player.name,
      gracePeriodSeconds: 30
    });

    // Start 30-second grace timer
    if (this.disconnectTimers.has(playerId)) {
      clearTimeout(this.disconnectTimers.get(playerId));
    }

    const timer = setTimeout(() => {
      this.removePlayerPermanently(playerId);
    }, 30000);

    this.disconnectTimers.set(playerId, timer);
    this.gameState.broadcastState();
  }

  handleReconnect(playerId, newSocketId) {
    const player = this.players.get(playerId);
    if (!player) return false;

    // Clear grace timer
    if (this.disconnectTimers.has(playerId)) {
      clearTimeout(this.disconnectTimers.get(playerId));
      this.disconnectTimers.delete(playerId);
    }

    player.isDisconnected = false;
    player.socketId = newSocketId;
    delete player.disconnectedAt;

    // Broadcast reconnection notice
    this.io.to(this.id).emit('playerReconnectedNotice', {
      playerId: player.id,
      playerName: player.name,
      scores: this.getScores()
    });

    return true;
  }

  removePlayerPermanently(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    this.disconnectTimers.delete(playerId);
    this.players.delete(playerId);

    // Reassign host if necessary
    if (this.hostId === playerId) {
      const activePlayers = this.getActivePlayers();
      if (activePlayers.length > 0) {
        this.hostId = activePlayers[0].id;
        this.io.to(this.id).emit('hostChanged', { newHostId: this.hostId });
      }
    }

    this.io.to(this.id).emit('playerLeftPermanently', {
      playerId,
      playerName: player.name,
      scores: this.getScores()
    });

    if (this.players.size === 0) {
      this.gameState.clearTimer();
    } else {
      this.gameState.broadcastState();
    }
  }
}

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> Room
    this.socketToRoom = new Map(); // socketId -> { roomId, playerId }
    this.sessionToRoom = new Map(); // sessionId -> { roomId, playerId }
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return this.rooms.has(code) ? this.generateRoomCode() : code;
  }

  createRoom(hostPlayer) {
    const roomId = this.generateRoomCode();
    const room = new Room(roomId, hostPlayer, this.io);
    this.rooms.set(roomId, room);
    this.mapSocket(hostPlayer.socketId, roomId, hostPlayer.id, hostPlayer.sessionId);
    return room;
  }

  getRoom(roomId) {
    if (!roomId) return null;
    return this.rooms.get(roomId.toUpperCase().trim());
  }

  joinRoom(roomId, player) {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, error: 'Room not found.' };

    // Check if player is reconnecting with an existing session
    const existingPlayer = room.getPlayer(player.id);
    if (existingPlayer) {
      room.handleReconnect(player.id, player.socketId);
    } else {
      room.addPlayer(player);
    }

    this.mapSocket(player.socketId, room.id, player.id, player.sessionId);
    return { success: true, room };
  }

  mapSocket(socketId, roomId, playerId, sessionId) {
    this.socketToRoom.set(socketId, { roomId, playerId });
    if (sessionId) {
      this.sessionToRoom.set(sessionId, { roomId, playerId });
    }
  }

  handleSocketDisconnect(socketId) {
    const mapping = this.socketToRoom.get(socketId);
    if (!mapping) return;

    const { roomId, playerId } = mapping;
    this.socketToRoom.delete(socketId);

    const room = this.rooms.get(roomId);
    if (room) {
      room.handleDisconnect(playerId, socketId);
      
      // Cleanup empty rooms after 2 minutes
      if (room.getActivePlayers().length === 0) {
        setTimeout(() => {
          if (room.getActivePlayers().length === 0) {
            this.rooms.delete(roomId);
          }
        }, 120000);
      }
    }
  }

  getRoomCount() {
    return this.rooms.size;
  }

  getTotalPlayerCount() {
    let count = 0;
    for (const r of this.rooms.values()) {
      count += r.getActivePlayers().length;
    }
    return count;
  }
}
