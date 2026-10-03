/**
 * connect.js
 * ----------
 * Opens ONE Mongoose connection that the whole app reuses.
 * (The MongoDB driver keeps an internal connection pool for us.)
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

export const connectDB = async () => {
  if (!env.MONGO_URI) {
    logger.warn('⚠️ No MONGO_URI provided — running in In-Memory Room Mode (Database optional for MVP)');
    return null;
  }

  try {
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    logger.warn(`⚠️ Could not connect to MongoDB (${err.message}) — falling back to In-Memory mode.`);
    return null;
  }
};
