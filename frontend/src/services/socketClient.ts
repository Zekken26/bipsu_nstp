import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocketUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
  if (apiBase === '/api') return window.location.origin;
  return apiBase.replace(/\/api\/?$/, '');
}

export function connectSocket(token?: string): Socket {
  if (socket?.connected) return socket;

  socket = io(getSocketUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 30000,
  });

  socket.on('connect', () => {});

  socket.on('data-changed', (data: { collection: string; action: string; timestamp: string }) => {
    window.dispatchEvent(new CustomEvent('nstp-socket-sync', { detail: data.collection }));
  });

  socket.on('disconnect', () => {});

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}