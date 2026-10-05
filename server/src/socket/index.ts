import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../prisma/client.js';

let ioInstance: SocketIOServer | null = null;

export function initSocket(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Join Project Room for real-time Kanban & task updates
    socket.on('join:project', ({ projectId, userId }) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
        console.log(`[Socket] User ${userId || socket.id} joined project room: project:${projectId}`);
      }
    });

    // Leave Project Room
    socket.on('leave:project', ({ projectId }) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
        console.log(`[Socket] Left project room: project:${projectId}`);
      }
    });

    // Join User-specific Room for private notifications (mentions, assignments)
    socket.on('join:user', ({ userId }) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket] Joined user notification room: user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.IO is not initialized yet');
  }
  return ioInstance;
}

/**
 * Emit task movement/update to all users currently viewing the project
 */
export function broadcastTaskUpdate(
  projectId: string,
  event: 'task:created' | 'task:updated' | 'task:deleted' | 'comment:created',
  payload: any
) {
  if (!ioInstance) return;
  ioInstance.to(`project:${projectId}`).emit(event, payload);
}

/**
 * Dispatch real-time user notification and persist in DB
 */
export async function sendNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: 'TASK_ASSIGNED' | 'MENTION' | 'STATUS_CHANGED' | 'DEADLINE' | 'ORG_ADDED';
  link?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
      },
    });

    if (ioInstance) {
      ioInstance.to(`user:${data.userId}`).emit('notification:new', notification);
    }

    return notification;
  } catch (err) {
    console.error('Failed to create/send notification:', err);
    return null;
  }
}
