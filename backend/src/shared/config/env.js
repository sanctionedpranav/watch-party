/**
 * env.js
 * ------
 * Loads environment variables ONCE and exports a validated config object.
 * Every other file imports from here instead of reading process.env directly,
 * so all configuration lives in one place.
 */
import dotenv from 'dotenv';

dotenv.config();

// MONGO_URI is optional for MVP (falls back to resilient in-memory store)
const JWT_SECRET = process.env.JWT_SECRET || 'youtube-watch-party-super-secret-key-2026';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
  PORT: Number(process.env.PORT) || 5000, // Render injects PORT automatically
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  // "https://a.vercel.app, http://localhost:5173" -> ['https://a.vercel.app', 'http://localhost:5173']
  CLIENT_URLS: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, '')) // remove trailing slash
    .filter(Boolean),
};
