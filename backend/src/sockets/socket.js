import { Server } from 'socket.io';
import logger from '../utils/logger.js';

let io;

// Every authenticated page load joins its per-user room (see useMwasalatSocket,
// wired up globally via MwasalatNotificationBell), so this doubles as a live
// "how many distinct users currently have the app open" count for the admin
// dashboard — keyed by userId (not socket.id) so multiple tabs from the same
// person count once, not per-tab. In-memory/single-process only, no Redis
// adapter in play here.
const onlineUserIdBySocket = new Map();
const socketCountByUserId = new Map();

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  io.of('/mwasalat').on('connection', (socket) => {
    logger.debug(`Mwasalat socket connected: ${socket.id}`);

    socket.on('join-room', (userId) => {
      socket.join(`mwasalat-user:${userId}`);
      logger.debug(`Mwasalat socket ${socket.id} joined room mwasalat-user:${userId}`);

      onlineUserIdBySocket.set(socket.id, userId);
      socketCountByUserId.set(userId, (socketCountByUserId.get(userId) ?? 0) + 1);
    });

    // Course discussion boards are group rooms (everyone enrolled), unlike
    // the per-user room above which backs 1:1 chat/notifications.
    socket.on('join-program-room', (programId) => {
      socket.join(`mwasalat-program:${programId}`);
    });

    socket.on('leave-program-room', (programId) => {
      socket.leave(`mwasalat-program:${programId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Mwasalat socket disconnected: ${socket.id}`);

      const userId = onlineUserIdBySocket.get(socket.id);
      if (userId) {
        onlineUserIdBySocket.delete(socket.id);
        const remaining = (socketCountByUserId.get(userId) ?? 1) - 1;
        if (remaining <= 0) socketCountByUserId.delete(userId);
        else socketCountByUserId.set(userId, remaining);
      }
    });
  });

  return io;
};

export const getOnlineUserCount = () => socketCountByUserId.size;

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export const broadcastMwasalatNotification = (notification) => {
  getIO().of('/mwasalat').emit('mwasalat:notification', notification);
};

export const emitToMwasalatUser = (userId, event, data) => {
  getIO().of('/mwasalat').to(`mwasalat-user:${userId}`).emit(event, data);
};

export const emitToMwasalatProgramRoom = (programId, event, data) => {
  getIO().of('/mwasalat').to(`mwasalat-program:${programId}`).emit(event, data);
};
