/**
 * AuthContext - global login state.
 * --------------------------------
 * Stores { user, token } and exposes login / register / logout.
 * On first load, if a token exists in localStorage we call /auth/me to
 * restore the session (and drop the token if it has expired).
 *
 * Why localStorage and not cookies? Frontend (Vercel) and backend (Render)
 * are on different domains; cross-site cookies need SameSite=None + HTTPS
 * setup. A Bearer token is simpler to explain and deploy. Trade-off: it is
 * readable by JavaScript, so XSS protection matters (React escapes output).
 */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../../modules/auth/api/auth.api';
import { TOKEN_KEY } from '../constants/config';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token)); // only "loading" if we must verify a token

  const saveSession = useCallback(({ user: newUser, token: newToken }) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Restore session on page refresh
  useEffect(() => {
    if (!token || user) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((data) => setUser(data.user))
      .catch(logout) // invalid/expired token
      .finally(() => setLoading(false));
  }, [token, user, logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login: async (credentials) => saveSession(await authApi.login(credentials)),
      register: async (details) => saveSession(await authApi.register(details)),
      logout,
    }),
    [user, token, loading, saveSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
