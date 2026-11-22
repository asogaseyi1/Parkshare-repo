import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import {
  IconAlert,
  IconArrowRight,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconMail,
} from '../components/Icons';
import { saveSession } from '../lib/session';
import './Auth.css';

const points = [
  'Reserve a spot before you leave the house',
  'Pay by the hour — never for a full day you don’t need',
  'Card details handled entirely by Stripe',
];

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      saveSession({ token: res.data.token, name: res.data.name, email });
      navigate('/dashboard');
    } catch (err: any) {
      const status = err?.response?.status;
      setError(
        status === 401
          ? 'That email and password combination doesn’t match an account.'
          : 'We couldn’t sign you in. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth__aside">
        <span className="auth__aside-orb auth__aside-orb--a" aria-hidden="true" />
        <span className="auth__aside-orb auth__aside-orb--b" aria-hidden="true" />

        <Link to="/" className="auth__aside-brand" aria-label="ParkShare home">
          <Logo size={30} inverse />
        </Link>

        <div className="auth__aside-body">
          <h1 className="auth__aside-title">
            Your spot is
            <br />
            waiting for you.
          </h1>
          <p className="auth__aside-text">
            Sign back in to manage your listings, check upcoming reservations and book parking in
            seconds.
          </p>

          <ul className="auth__points">
            {points.map((point) => (
              <li key={point}>
                <IconCheck />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <figure className="auth__quote">
          <p>
            “I used to budget twenty minutes just to find parking downtown. Now I book a driveway
            two streets over before I pull out of my own.”
          </p>
          <footer>
            <span className="auth__quote-avatar">MK</span>
            Maya K. · driver since 2024
          </footer>
        </figure>
      </aside>

      <main className="auth__main">
        <div className="auth__top-bar">
          <Link to="/" className="auth__mobile-brand" aria-label="ParkShare home">
            <Logo size={28} />
          </Link>
          <span className="spacer" />
          <ThemeToggle />
        </div>

        <div className="auth__card card card-pad">
          <header className="auth__head">
            <h2 className="auth__title">Welcome back</h2>
            <p className="auth__sub">Log in to your ParkShare account to keep going.</p>
          </header>

          <form className="auth__form" onSubmit={handleLogin} noValidate>
            {error && (
              <div className="alert alert-danger" role="alert">
                <IconAlert />
                <span>{error}</span>
              </div>
            )}

            <div className="field">
              <label className="label" htmlFor="login-email">
                Email
              </label>
              <div className="input-group">
                <IconMail />
                <input
                  id="login-email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="login-password">
                Password
              </label>
              <div className="input-group">
                <input
                  id="login-password"
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error}
                  required
                />
                <button
                  type="button"
                  className="input-group__action"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block auth__submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  Log in
                  <IconArrowRight />
                </>
              )}
            </button>
          </form>

          <p className="auth__alt">
            New to ParkShare? <Link to="/register">Create a free account</Link>
          </p>
        </div>

        <p className="auth__legal">Protected by Stripe. We never store your card details.</p>
      </main>
    </div>
  );
};

export default Login;
