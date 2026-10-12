import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 
  (window.location.port === '5173' ? 'http://localhost:4000' : window.location.origin);

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

export function getOrCreateSessionId() {
  let id = localStorage.getItem('dc_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('dc_session_id', id);
  }
  return id;
}

export function getStoredPlayerName() {
  return localStorage.getItem('dc_player_name') || '';
}

export function saveStoredPlayerName(name) {
  if (name) localStorage.setItem('dc_player_name', name);
}

export function getStoredAvatar() {
  const av = localStorage.getItem('dc_player_avatar');
  return av !== null ? parseInt(av, 10) : 0;
}

export function saveStoredAvatar(avatar) {
  localStorage.setItem('dc_player_avatar', avatar);
}
