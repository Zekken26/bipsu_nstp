import { Server } from 'socket.io';

let io = null;

export function setupWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      socket.join(`user:${token}`);
    }
    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO() {
  return io;
}

export function emitCollectionChange(collection, action = 'updated') {
  if (!io) return;
  io.emit('data-changed', { collection, action, timestamp: new Date().toISOString() });
}