import { io } from 'socket.io-client';

// In development, Vite runs on port 5173 and backend on port 4000.
// In production or when proxied, origin matches.
const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 
  (window.location.port === '5173' ? 'http://localhost:4000' : window.location.origin);

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

// Helper to retrieve or persist unique player session ID in localStorage
export function getOrCreateSessionId() {
  let id = localStorage.getItem('skribbl_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('skribbl_session_id', id);
  }
  return id;
}

export function getStoredPlayerName() {
  return localStorage.getItem('skribbl_player_name') || '';
}

export function saveStoredPlayerName(name) {
  if (name) localStorage.setItem('skribbl_player_name', name);
}

export function getStoredAvatar() {
  const av = localStorage.getItem('skribbl_player_avatar');
  return av !== null ? parseInt(av, 10) : 0;
}

export function saveStoredAvatar(avatar) {
  localStorage.setItem('skribbl_player_avatar', avatar);
}
