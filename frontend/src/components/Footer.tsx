import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import './Footer.css';

const Footer: React.FC = () => (
  <footer className="footer">
    <div className="container footer__inner">
      <div className="footer__brand">
        <Logo size={28} />
        <p className="footer__tagline">
          Parking, shared. Turn an empty driveway into income — or find a guaranteed spot before you
          leave the house.
        </p>
      </div>

      <nav className="footer__cols" aria-label="Footer">
        <div className="footer__col">
          <h4 className="footer__col-title">Drivers</h4>
          <Link to="/listings">Find parking</Link>
          <a href="#how-it-works">How it works</a>
          <a href="#features">Why ParkShare</a>
        </div>
        <div className="footer__col">
          <h4 className="footer__col-title">Hosts</h4>
          <Link to="/create-parking">List a space</Link>
          <a href="#earnings">Earnings</a>
          <a href="#how-it-works">How hosting works</a>
        </div>
        <div className="footer__col">
          <h4 className="footer__col-title">Account</h4>
          <Link to="/login">Log in</Link>
          <Link to="/register">Create account</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      </nav>
    </div>

    <div className="container footer__base">
      <span>© {new Date().getFullYear()} ParkShare</span>
      <span className="footer__dot" aria-hidden="true">
        •
      </span>
      <span>Payments secured by Stripe</span>
    </div>
  </footer>
);

export default Footer;
