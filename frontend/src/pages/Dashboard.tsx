// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/Navbar';
import api from '../api/axios';
import {
  IconAlert,
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconLayers,
  IconList,
  IconMap,
  IconPin,
  IconPlus,
  IconTrend,
  IconWallet,
} from '../components/Icons';
import { getEmail, getName, initialsOf } from '../lib/session';
import { formatDateTime, formatMoney, formatToday } from '../lib/format';
import { currencyForCountry, ParkingSpace, PricingConfig } from '../types/ParkingSpace';
import './Dashboard.css';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard: React.FC = () => {
  const name = getName() || 'there';
  const email = getEmail();

  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .get('/parking-spaces')
      .then((res) => {
        if (!active) return;
        setSpaces(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));

    // Best-effort — if this fails, projected earnings just falls back to gross.
    api
      .get('/pricing/config')
      .then((res) => active && setPricingConfig(res.data))
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const mine = useMemo(
    () =>
      email
        ? spaces.filter((space) => space.ownerEmail?.toLowerCase() === email.toLowerCase())
        : [],
    [spaces, email]
  );

  const avgPrice = useMemo(() => {
    if (spaces.length === 0) return 0;
    return spaces.reduce((sum, space) => sum + (Number(space.pricePerHour) || 0), 0) / spaces.length;
  }, [spaces]);

  // A simple, clearly-labelled projection so the number isn't mistaken for real revenue.
  // Net of ParkShare's host service fee once /pricing/config has loaded, matching what
  // the host would actually be paid out — not the gross rate the renter sees.
  const hostFeeRate = (pricingConfig?.hostServiceFeePercent ?? 0) / 100;
  const projected = useMemo(
    () =>
      mine.reduce((sum, space) => sum + (Number(space.pricePerHour) || 0) * (1 - hostFeeRate) * 5 * 14, 0),
    [mine, hostFeeRate]
  );

  const stats = [
    {
      label: 'Your listings',
      value: loading ? null : String(mine.length),
      icon: <IconLayers />,
      hint: mine.length === 0 ? 'Nothing listed yet' : 'Live on the map',
      tone: 'primary',
    },
    {
      label: 'Spots available',
      value: loading ? null : String(spaces.length),
      icon: <IconPin />,
      hint: 'Across all hosts',
      tone: 'accent',
    },
    {
      label: 'Average rate',
      value: loading ? null : formatMoney(avgPrice),
      icon: <IconTrend />,
      hint: 'Per hour, platform-wide',
      tone: 'warning',
    },
    {
      label: 'Projected earnings',
      value: loading ? null : formatMoney(projected),
      icon: <IconWallet />,
      hint: pricingConfig
        ? `Net of ParkShare's ${pricingConfig.hostServiceFeePercent}% host fee`
        : '5 hrs/day · 14 days a month',
      tone: 'success',
    },
  ];

  return (
    <div className="page">
      <NavBar />

      <div className="container">
        {/* ------------------------------------------------------------ hero */}
        <header className="dash__hero">
          <span className="avatar avatar-lg" aria-hidden="true">
            {initialsOf(getName())}
          </span>
          <div className="dash__hero-copy">
            <span className="eyebrow">{formatToday()}</span>
            <h1 className="dash__title">
              {greeting()}, {name}
            </h1>
            <p className="dash__sub">
              {mine.length > 0
                ? `You have ${mine.length} space${mine.length === 1 ? '' : 's'} listed. Here’s how the network looks today.`
                : 'Find a spot for today, or turn your own driveway into income.'}
            </p>
          </div>
          <div className="dash__hero-actions">
            <Link to="/listings" className="btn btn-secondary">
              <IconMap />
              Find parking
            </Link>
            <Link to="/create-parking" className="btn btn-primary">
              <IconPlus />
              List a space
            </Link>
          </div>
        </header>

        {failed && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '1.5rem' }}>
            <IconAlert />
            <span>
              We couldn’t reach the ParkShare service. Your stats may be out of date — check that
              the backend is running.
            </span>
          </div>
        )}

        {/* ----------------------------------------------------------- stats */}
        <section className="stat-grid" aria-label="Overview">
          {stats.map((stat, index) => (
            <article key={stat.label} className={`stat card card-pad animate-in delay-${index + 1}`}>
              <span className={`stat__icon stat__icon--${stat.tone}`}>{stat.icon}</span>
              <p className="stat__label">{stat.label}</p>
              {stat.value === null ? (
                <span className="skeleton stat__skeleton" />
              ) : (
                <p className="stat__value">{stat.value}</p>
              )}
              <p className="stat__hint">{stat.hint}</p>
            </article>
          ))}
        </section>

        {/* --------------------------------------------------------- actions */}
        <section className="action-grid">
          <Link to="/listings" className="action card card-hover">
            <span className="action__icon">
              <IconMap />
            </span>
            <div className="action__body">
              <h2 className="action__title">Find parking near you</h2>
              <p className="action__text">
                Browse live listings on the map, compare hourly rates and reserve a window.
              </p>
            </div>
            <IconArrowRight className="action__arrow" />
          </Link>

          <Link to="/create-parking" className="action action--accent card card-hover">
            <span className="action__icon">
              <IconPlus />
            </span>
            <div className="action__body">
              <h2 className="action__title">List a parking space</h2>
              <p className="action__text">
                Drop a pin, set your rate and availability, and start earning from an empty spot.
              </p>
            </div>
            <IconArrowRight className="action__arrow" />
          </Link>
        </section>

        {/* -------------------------------------------------------- listings */}
        <section className="dash__section">
          <div className="dash__section-head">
            <h2 className="dash__section-title">
              <IconList />
              Your listings
            </h2>
            {mine.length > 0 && (
              <Link to="/create-parking" className="btn btn-soft btn-sm">
                <IconPlus />
                Add another
              </Link>
            )}
          </div>

          {loading ? (
            <div className="my-listings">
              {[0, 1].map((index) => (
                <div key={index} className="card card-pad">
                  <span className="skeleton" style={{ display: 'block', height: '1.1rem', width: '55%' }} />
                  <span
                    className="skeleton"
                    style={{ display: 'block', height: '0.8rem', width: '35%', marginTop: '0.7rem' }}
                  />
                </div>
              ))}
            </div>
          ) : mine.length === 0 ? (
            <div className="card card-pad">
              <div className="empty-state">
                <span className="empty-state__icon">
                  <IconWallet />
                </span>
                <p className="empty-state__title">
                  {email ? 'No listings yet' : 'Sign in again to see your listings'}
                </p>
                <p className="empty-state__text">
                  {email
                    ? 'A single driveway rented five hours a day can bring in a few hundred dollars a month. Listing takes about two minutes.'
                    : 'We match listings to the email you logged in with. Log out and back in to link them.'}
                </p>
                <Link to="/create-parking" className="btn btn-primary" style={{ marginTop: '0.6rem' }}>
                  <IconPlus />
                  List your first space
                </Link>
              </div>
            </div>
          ) : (
            <div className="my-listings">
              {mine.map((space) => (
                <article key={space.id} className="listing-row card card-hover">
                  <span className="listing-row__icon">
                    <IconPin />
                  </span>
                  <div className="listing-row__body">
                    <h3 className="listing-row__title">{space.title}</h3>
                    <p className="listing-row__meta">
                      <IconClock />
                      {formatDateTime(space.availableFrom)} → {formatDateTime(space.availableTo)}
                    </p>
                  </div>
                  <span className="listing-row__price">
                    {formatMoney(space.pricePerHour, currencyForCountry(space.country))}
                    <small>/hr</small>
                  </span>
                  <Link to={`/listings/${space.id}/manage`} className="btn btn-ghost btn-sm">
                    <IconCalendar />
                    Manage
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
