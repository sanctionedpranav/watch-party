/** Shortcut so components write `useAuth()` instead of useContext(AuthContext) */
import { useContext } from 'react';
import { AuthContext } from '../../../shared/context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
};
