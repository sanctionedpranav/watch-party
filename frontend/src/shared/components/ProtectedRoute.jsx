/**
 * ProtectedRoute - only renders its children for logged-in users.
 * Otherwise redirects to /login and remembers where the user wanted to go
 * (so an invite link /room/ABC123 still works after logging in).
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import Loader from './Loader';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader text="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
};

export default ProtectedRoute;
