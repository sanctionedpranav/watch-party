/**
 * AuthForm - shared by LoginPage and RegisterPage.
 * `mode` decides which fields are shown and which auth function is called.
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const AuthForm = ({ mode }) => {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isRegister) await register(form);
      else await login({ email: form.email, password: form.password });
      // Go back to the page the user originally wanted (e.g. an invite link)
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <p className="muted">
        {isRegister ? 'Pick a name your friends will recognise.' : 'Log in to start or join a watch party.'}
      </p>

      {isRegister && (
        <label className="field">
          Username
          <input name="username" value={form.username} onChange={handleChange} minLength={3} maxLength={20} required />
        </label>
      )}
      <label className="field">
        Email
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
      </label>
      <label className="field">
        Password
        <input name="password" type="password" value={form.password} onChange={handleChange} minLength={6} required />
      </label>

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
      </button>

      <p className="muted auth-switch">
        {isRegister ? 'Already have an account? ' : 'New here? '}
        <Link to={isRegister ? '/login' : '/register'} state={location.state}>
          {isRegister ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </form>
  );
};

export default AuthForm;
