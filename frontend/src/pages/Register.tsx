import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import {
  IconAlert,
  IconArrowRight,
  IconCheckCircle,
  IconEye,
  IconEyeOff,
  IconMail,
  IconPhone,
  IconUser,
  IconWallet,
} from '../components/Icons';
import './Auth.css';

const perks = [
  'List a driveway in under two minutes',
  'You set the hourly rate and the hours',
  'Stripe handles every payout, end to end',
];

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

/** Rough password heuristic — length plus character variety. */
const scorePassword = (value: string) => {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 4);
};

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const score = useMemo(() => scorePassword(formData.password), [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Please choose a password of at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', { ...formData, roles: ['USER'] });

      if (response.status === 200) {
        setDone(true);
        // Brief confirmation before handing off to the login screen.
        setTimeout(() => navigate('/login'), 1200);
      }
    } catch (err: any) {
      setError(
        err?.response?.status === 400
          ? 'An account with that email already exists. Try logging in instead.'
          : 'Registration failed. Please check your details and try again.'
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
            Join the street
            <br />
            that shares.
          </h1>
          <p className="auth__aside-text">
            One account covers both sides of ParkShare — book parking when you need it, and rent out
            your own space when you don’t.
          </p>

          <ul className="auth__points">
            {perks.map((perk) => (
              <li key={perk}>
                <IconWallet />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <figure className="auth__quote">
          <p>
            “My garage pays for itself now. I listed it on a Sunday and had three bookings before
            the week was out.”
          </p>
          <footer>
            <span className="auth__quote-avatar">DR</span>
            Dev R. · host in Leslieville
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
            <h2 className="auth__title">Create your account</h2>
            <p className="auth__sub">Free to join. No subscription, no listing fees.</p>
          </header>

          {done ? (
            <div className="alert alert-success" role="status">
              <IconCheckCircle />
              <span>
                <strong>Account created.</strong> Taking you to the login screen…
              </span>
            </div>
          ) : (
            <form className="auth__form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="alert alert-danger" role="alert">
                  <IconAlert />
                  <span>{error}</span>
                </div>
              )}

              <div className="field">
                <label className="label" htmlFor="reg-name">
                  Full name
                </label>
                <div className="input-group">
                  <IconUser />
                  <input
                    id="reg-name"
                    className="input"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="reg-email">
                  Email
                </label>
                <div className="input-group">
                  <IconMail />
                  <input
                    id="reg-email"
                    className="input"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="reg-phone">
                  Phone number
                  <span className="label__hint">For booking updates</span>
                </label>
                <div className="input-group">
                  <IconPhone />
                  <input
                    id="reg-phone"
                    className="input"
                    name="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(416) 555-0142"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="reg-password">
                  Password
                  <span className="label__hint">8+ characters</span>
                </label>
                <div className="input-group">
                  <input
                    id="reg-password"
                    className="input"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
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

                {formData.password && (
                  <div className="strength" data-score={score}>
                    <div className="strength__track" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="strength__label">
                      Password strength: {strengthLabels[score] || 'Weak'}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block auth__submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <IconArrowRight />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="auth__alt">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>

        <p className="auth__legal">
          By creating an account you agree to our terms of service and privacy policy.
        </p>
      </main>
    </div>
  );
};

export default Register;
