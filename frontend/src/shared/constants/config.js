/**
 * App-wide config.
 * Vite exposes env vars that start with VITE_ via import.meta.env
 * (set VITE_API_URL in Vercel -> Project -> Settings -> Environment Variables).
 */
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export const TOKEN_KEY = 'watchparty_token';
