import { Link } from 'react-router-dom';
import { useAuth } from '../../modules/auth/hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span aria-hidden="true">🍿</span> Watch Party
      </Link>
      {user && (
        <div className="navbar-user">
          <span className="navbar-name">{user.username}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
