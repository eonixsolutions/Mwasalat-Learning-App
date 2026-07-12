import { createServer } from 'http';
import app from './src/app.js';
import { initSocket } from './src/sockets/socket.js';
import { connectDB } from './src/config/db.js';
import { startScheduler } from './src/services/scheduler.js';
import logger from './src/utils/logger.js';

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
initSocket(httpServer);

const start = async () => {
  await connectDB();
  startScheduler();
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
};

start();
