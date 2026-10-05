import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || window.location.origin;
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ Socket.IO connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error (will retry):', err.message);
    });
  }
  return socket;
}

export function joinProjectRoom(projectId: string, userId: string) {
  const s = getSocket();
  s.emit('join:project', { projectId, userId });
}

export function leaveProjectRoom(projectId: string) {
  const s = getSocket();
  s.emit('leave:project', { projectId });
}

export function joinUserRoom(userId: string) {
  const s = getSocket();
  s.emit('join:user', { userId });
}
