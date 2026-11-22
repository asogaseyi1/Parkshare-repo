// src/pages/Home.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/Navbar';
import Footer from '../components/Footer';
import Logo from '../components/Logo';
import {
  IconArrowRight,
  IconBolt,
  IconCar,
  IconCheck,
  IconClock,
  IconKey,
  IconPin,
  IconSearch,
  IconShield,
  IconSparkle,
  IconTrend,
  IconWallet,
} from '../components/Icons';
import { isLoggedIn } from '../lib/session';
import './Home.css';

const features = [
  {
    icon: <IconPin />,
    title: 'Spots where you actually park',
    text: 'Driveways, garages and private lots mapped block by block — not a sea of overpriced downtown towers.',
  },
  {
    icon: <IconBolt />,
    title: 'Reserved in three taps',
    text: 'Pick a spot, set your window, pay. Your space is held for you before you turn the ignition.',
  },
  {
    icon: <IconClock />,
    title: 'Pay by the hour',
    text: 'Hosts set an hourly rate and the hours they are free. You pay for the time you book — nothing more.',
  },
  {
    icon: <IconShield />,
    title: 'Payments you can trust',
    text: 'Every transaction runs through Stripe. Card details never touch ParkShare servers.',
  },
];

const steps = [
  {
    icon: <IconSearch />,
    title: 'Search the map',
    text: 'Type a city or pan around. Live listings show their hourly price right on the pin.',
  },
  {
    icon: <IconKey />,
    title: 'Book your window',
    text: 'Choose start and end times. We total the cost before you confirm — no surprise fees.',
  },
  {
    icon: <IconCar />,
    title: 'Park and go',
    text: 'Pull in to a spot that is genuinely yours for the window you paid for.',
  },
];

const hostPerks = [
  'Set your own hourly rate',
  'Choose exactly when you are available',
  'Payouts handled by Stripe',
  'Unlist any time, no lock-in',
];

const Home: React.FC = () => {
  const loggedIn = isLoggedIn();

  return (
    <div className="page home">
      <NavBar />

      {/* ---------------------------------------------------------------- hero */}
      <section className="hero">
        <div className="hero__orb hero__orb--a" aria-hidden="true" />
        <div className="hero__orb hero__orb--b" aria-hidden="true" />
        <div className="hero__grid-bg" aria-hidden="true" />

        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="hero__pill animate-in">
              <IconSparkle />
              Live now in the Greater Toronto Area
            </span>

            <h1 className="hero__title animate-in delay-1">
              Parking you can
              <br />
              <span className="text-gradient">count on.</span>
            </h1>

            <p className="hero__sub animate-in delay-2">
              ParkShare connects drivers with the empty driveways, garages and private spots already
              sitting on their street. Book by the hour, pay securely, and skip the circling.
            </p>

            <div className="hero__cta animate-in delay-3">
              <Link to={loggedIn ? '/listings' : '/register'} className="btn btn-primary btn-lg">
                {loggedIn ? 'Find parking' : 'Find parking near me'}
                <IconArrowRight />
              </Link>
              <Link
                to={loggedIn ? '/create-parking' : '/login'}
                className="btn btn-secondary btn-lg"
              >
                {loggedIn ? 'List your space' : 'I have a space to rent'}
              </Link>
            </div>

            <dl className="hero__stats animate-in delay-4">
              <div className="hero__stat">
                <dt>Average saving</dt>
                <dd>
                  42<span>%</span>
                </dd>
              </div>
              <div className="hero__stat">
                <dt>Booking time</dt>
                <dd>
                  30<span>sec</span>
                </dd>
              </div>
              <div className="hero__stat">
                <dt>Host payout</dt>
                <dd>
                  <span className="hero__stat-pre">$</span>210<span>/mo</span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Stylised product preview — pure CSS/SVG, no screenshots to go stale */}
          <div className="hero__visual animate-in delay-2" aria-hidden="true">
            <div className="preview">
              <div className="preview__map">
                <svg className="preview__roads" viewBox="0 0 320 300" preserveAspectRatio="none">
                  <g stroke="currentColor" strokeWidth="10" strokeLinecap="round" opacity="0.14">
                    <path d="M-10 70 H330" />
                    <path d="M-10 190 H330" />
                    <path d="M70 -10 V310" />
                    <path d="M215 -10 V310" />
                  </g>
                  <g stroke="currentColor" strokeWidth="3" opacity="0.1">
                    <path d="M-10 130 H330" />
                    <path d="M145 -10 V310" />
                    <path d="M280 -10 V310" />
                  </g>
                  <rect x="86" y="86" width="44" height="30" rx="4" fill="currentColor" opacity="0.07" />
                  <rect x="232" y="146" width="56" height="30" rx="4" fill="currentColor" opacity="0.07" />
                  <rect x="18" y="204" width="38" height="46" rx="4" fill="currentColor" opacity="0.07" />
                </svg>

                <span className="preview__pin preview__pin--1">$4</span>
                <span className="preview__pin preview__pin--2">$6</span>
                <span className="preview__pin preview__pin--3 is-active">$3</span>
                <span className="preview__ping" />
              </div>

              <div className="preview__card">
                <div className="preview__card-head">
                  <div className="preview__thumb">
                    <IconCar />
                  </div>
                  <div>
                    <strong>Shaded driveway · Riverdale</strong>
                    <span className="preview__meta">
                      <IconPin /> 240 m away · available till 9 pm
                    </span>
                  </div>
                </div>
                <div className="preview__card-foot">
                  <span className="preview__price">
                    $3<small>/hr</small>
                  </span>
                  <span className="preview__btn">
                    Reserve <IconArrowRight />
                  </span>
                </div>
              </div>

              <div className="preview__toast">
                <span className="preview__toast-icon">
                  <IconCheck />
                </span>
                Spot confirmed · 2:00–6:00 pm
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ features */}
      <section className="section" id="features">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow">Why ParkShare</span>
            <h2>Built for the five minutes before you arrive</h2>
            <p className="section__sub">
              No meter roulette, no full-lot gamble. Just a spot that is held in your name.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature, index) => (
              <article key={feature.title} className={`feature card card-pad card-hover animate-in delay-${index + 1}`}>
                <span className="feature__icon">{feature.icon}</span>
                <h3 className="feature__title">{feature.title}</h3>
                <p className="feature__text">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- how it works */}
      <section className="section section--sunken" id="how-it-works">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow">How it works</span>
            <h2>Three steps, start to parked</h2>
          </div>

          <ol className="steps">
            {steps.map((step, index) => (
              <li key={step.title} className="step">
                <span className="step__num">{String(index + 1).padStart(2, '0')}</span>
                <span className="step__icon">{step.icon}</span>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__text">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------ earnings */}
      <section className="section" id="earnings">
        <div className="container earnings">
          <div className="earnings__copy">
            <span className="eyebrow">For hosts</span>
            <h2>
              Your driveway sits empty <span className="text-gradient">9 hours a day.</span>
            </h2>
            <p className="section__sub">
              Put those hours to work. List the space once, set your rate and availability, and let
              ParkShare handle discovery and payment.
            </p>

            <ul className="earnings__list">
              {hostPerks.map((perk) => (
                <li key={perk}>
                  <IconCheck />
                  {perk}
                </li>
              ))}
            </ul>

            <Link to={loggedIn ? '/create-parking' : '/register'} className="btn btn-primary btn-lg">
              <IconWallet />
              Start earning
            </Link>
          </div>

          <aside className="earnings__card card card-pad">
            <header className="earnings__card-head">
              <span className="badge badge-accent">
                <IconTrend />
                Estimated monthly
              </span>
            </header>
            <p className="earnings__amount">
              $210<small>/month</small>
            </p>
            <p className="earnings__note">
              Based on one spot at $3/hr, rented 5 hours a day, 14 days a month.
            </p>

            <div className="earnings__bars" aria-hidden="true">
              {[38, 52, 46, 68, 74, 61, 88].map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="earnings__bars-axis" aria-hidden="true">
              <span>Mon</span>
              <span>Sun</span>
            </div>
          </aside>
        </div>
      </section>

      {/* ----------------------------------------------------------------- cta */}
      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div className="cta-band__glow" aria-hidden="true" />
            <Logo markOnly size={44} className="cta-band__mark" />
            <h2 className="cta-band__title">Find your spot in the next 30 seconds</h2>
            <p className="cta-band__sub">
              Free to join. No subscription. Pay only for the hours you park.
            </p>
            <div className="cta-band__actions">
              <Link to={loggedIn ? '/listings' : '/register'} className="btn btn-lg cta-band__primary">
                {loggedIn ? 'Open the map' : 'Create a free account'}
                <IconArrowRight />
              </Link>
              {!loggedIn && (
                <Link to="/login" className="btn btn-lg cta-band__ghost">
                  I already have an account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
