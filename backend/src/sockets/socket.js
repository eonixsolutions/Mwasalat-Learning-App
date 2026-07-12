import { Server } from 'socket.io';
import logger from '../utils/logger.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    socket.on('join-room', (userId) => {
      socket.join(`user:${userId}`);
      logger.debug(`Socket ${socket.id} joined room user:${userId}`);
    });

    // Student active-usage heartbeat — emitted every 5 min when app is in use
    socket.on('heartbeat', async (userId) => {
      try {
        const Student = (await import('../modules/student/student.model.js')).default;
        const { appUsageRepository } = await import('../modules/attendance/app-usage.repository.js');
        const student = await Student.findOne({ user: userId }, '_id');
        if (student) await appUsageRepository.recordHeartbeat(student._id);
      } catch (err) {
        logger.error('[socket] heartbeat error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export const emitToUser = (userId, event, data) => {
  getIO().to(`user:${userId}`).emit(event, data);
};

export const broadcastTaskSheetUpdate = (courseId, week) => {
  getIO().emit('task_sheet_published', { courseId: courseId.toString(), week });
};
