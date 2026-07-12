import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);

    // Drop legacy unique index on students.user (was replaced by compound user+course index)
    await conn.connection.db
      .collection('students')
      .dropIndex('user_1')
      .then(() => logger.info('Dropped legacy unique index: students.user_1'))
      .catch(() => {});
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};
