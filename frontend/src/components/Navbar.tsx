import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import {
  IconArrowLeft,
  IconCalendar,
  IconClose,
  IconLayers,
  IconLogout,
  IconMap,
  IconMenu,
  IconMessage,
  IconPlus,
} from './Icons';
import { clearSession, getName, initialsOf, isLoggedIn } from '../lib/session';
import './Navbar.css';

interface NavbarProps {
  /** Show a "Back to dashboard" affordance instead of the marketing links. */
  backToDashboard?: boolean;
}

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: <IconLayers /> },
  { to: '/listings', label: 'Find parking', icon: <IconMap /> },
  { to: '/create-parking', label: 'List a space', icon: <IconPlus /> },
  { to: '/bookings', label: 'Bookings', icon: <IconCalendar /> },
  { to: '/messages', label: 'Messages', icon: <IconMessage /> },
];

const Navbar: React.FC<NavbarProps> = ({ backToDashboard = false }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const loggedIn = isLoggedIn();
  const name = getName();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile sheet whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const navLinks = loggedIn ? links : [];

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav__inner">
        <Link to={loggedIn ? '/dashboard' : '/'} className="nav__brand" aria-label="ParkShare home">
          <Logo size={30} />
        </Link>

        {backToDashboard && (
          <Link to="/dashboard" className="nav__link nav__desktop-only" style={{ marginLeft: '0.5rem' }}>
            <IconArrowLeft />
            Dashboard
          </Link>
        )}

        {!backToDashboard && navLinks.length > 0 && (
          <nav className="nav__links" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav__link ${pathname === link.to ? 'nav__link--active' : ''}`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="nav__actions">
          <ThemeToggle />

          {loggedIn ? (
            <>
              <div className="nav__user nav__desktop-only">
                <span className="nav__user-name">{name || 'User'}</span>
                <span className="avatar" aria-hidden="true">
                  {initialsOf(name)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-ghost btn-sm nav__desktop-only"
                title="Log out"
              >
                <IconLogout />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm nav__desktop-only">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm nav__desktop-only">
                Get started
              </Link>
            </>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-icon nav__burger"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="nav__sheet">
          {loggedIn ? (
            <>
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav__link ${pathname === link.to ? 'nav__link--active' : ''}`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              <button type="button" onClick={handleLogout} className="btn btn-secondary">
                <IconLogout />
                Log out {name ? `(${name})` : ''}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
