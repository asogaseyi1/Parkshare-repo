import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import useTheme from '../hooks/useTheme';
import {
  IconAlert,
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCar,
  IconCard,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconInfo,
  IconLock,
  IconMail,
  IconMessage,
  IconPin,
  IconShield,
  IconTag,
  IconUser,
} from '../components/Icons';
import { getEmail } from '../lib/session';
import { formatDateTime, formatDuration, formatMoney, formatPercent, hoursBetween, nextQuarterHourLocal } from '../lib/format';
import { ParkingSpace, PriceBreakdown } from '../types/ParkingSpace';
import './ReservationPage.css';

/** Stripe Elements are iframed, so they need explicit colours per theme. */
const cardOptions = (theme: 'light' | 'dark') => ({
  style: {
    base: {
      fontSize: '15px',
      fontFamily: 'Inter, Segoe UI, sans-serif',
      color: theme === 'dark' ? '#eceef5' : '#171a28',
      iconColor: theme === 'dark' ? '#9aa2b8' : '#6e778f',
      '::placeholder': { color: theme === 'dark' ? '#6e778f' : '#9aa2b8' },
    },
    invalid: {
      color: theme === 'dark' ? '#f87171' : '#d6353b',
      iconColor: theme === 'dark' ? '#f87171' : '#d6353b',
    },
  },
});

/** What the confirmation screen reads off the created Reservation. */
interface ConfirmedReservation {
  currency: string;
  baseAmount: number;
  guestServiceFee: number;
  tax: number;
  totalCharged: number;
  hostPayout: number;
  specialRateName?: string | null;
  discountPercent?: number;
}

const ReservationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { resolved } = useTheme();
  const stripe = useStripe();
  const elements = useElements();

  const [space, setSpace] = useState<ParkingSpace | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [userEmail, setUserEmail] = useState(getEmail() || '');
  const [startTime, setStartTime] = useState(nextQuarterHourLocal());
  const [endTime, setEndTime] = useState(nextQuarterHourLocal(3));

  const [quote, setQuote] = useState<PriceBreakdown | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmedReservation | null>(null);

  const [messaging, setMessaging] = useState(false);
  const [messageError, setMessageError] = useState('');

  useEffect(() => {
    if (!id || id === 'undefined') {
      setLoadFailed(true);
      setLoading(false);
      return;
    }

    let active = true;

    // `api` already carries the /api prefix in its baseURL.
    api
      .get(`/parking-spaces/${id}`)
      .then((res) => active && setSpace(res.data))
      .catch(() => active && setLoadFailed(true))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id]);

  const hours = useMemo(() => hoursBetween(startTime, endTime), [startTime, endTime]);

  // Fetches the real Airbnb-style breakdown from the backend — the client never
  // computes the chargeable total itself, since fees/tax depend on the
  // listing's country (see PricingService on the backend).
  useEffect(() => {
    if (!id || hours <= 0) {
      setQuote(null);
      setQuoteError('');
      return;
    }

    let active = true;
    setQuoteLoading(true);
    setQuoteError('');

    const timer = setTimeout(() => {
      api
        .get(`/parking-spaces/${id}/price-quote`, { params: { startTime, endTime } })
        .then((res) => active && setQuote(res.data))
        .catch((err) => {
          if (!active) return;
          setQuote(null);
          setQuoteError(err?.response?.data?.message || 'Couldn’t price this window. Try different times.');
        })
        .finally(() => active && setQuoteLoading(false));
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id, startTime, endTime, hours]);

  const currency = quote?.currency || 'CAD';

  const handleMessageHost = () => {
    if (!id) return;
    setMessaging(true);
    setMessageError('');

    api
      .post('/conversations', { parkingSpaceId: id })
      .then((res) => navigate(`/messages?conversationId=${res.data.id}`))
      .catch(() => setMessageError('Couldn’t start that conversation. Try again.'))
      .finally(() => setMessaging(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (hours <= 0) {
      setError('Your end time needs to be after your start time.');
      return;
    }
    if (!quote) {
      setError('We couldn’t price this booking yet. Please wait a moment and try again.');
      return;
    }
    if (!stripe || !elements) {
      setError('Payments are still loading. Give it a second and try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('The card field didn’t load. Please refresh and try again.');
      return;
    }

    setSubmitting(true);

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (stripeError || !paymentMethod) {
      setError(stripeError?.message || 'We couldn’t validate that card.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/reservations/create', {
        userEmail,
        parkingSpaceId: id,
        startTime,
        endTime,
        paymentMethodId: paymentMethod.id,
      });
      setConfirmed(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Reservation failed. Your card was not charged.');
    } finally {
      setSubmitting(false);
    }
  };

  /* --------------------------------------------------------------- states -- */

  if (loading) {
    return (
      <div className="page">
        <Navbar backToDashboard />
        <div className="loading-pane">
          <span className="spinner spinner-lg" />
          Loading this space…
        </div>
      </div>
    );
  }

  if (loadFailed || !space) {
    return (
      <div className="page">
        <Navbar backToDashboard />
        <div className="container">
          <div className="card card-pad" style={{ maxWidth: '34rem', margin: '3rem auto' }}>
            <div className="empty-state">
              <span className="empty-state__icon">
                <IconAlert />
              </span>
              <p className="empty-state__title">We couldn’t find that space</p>
              <p className="empty-state__text">
                It may have been unlisted, or the link is incomplete. Head back to the map and pick
                another spot.
              </p>
              <Link to="/listings" className="btn btn-primary" style={{ marginTop: '0.6rem' }}>
                <IconPin />
                Back to listings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="page">
        <Navbar backToDashboard />
        <div className="container">
          <div className="card card-pad reserve__done">
            <span className="reserve__done-icon">
              <IconCheckCircle />
            </span>
            <h1 className="reserve__done-title">Spot confirmed</h1>
            <p className="text-muted">
              {space.title} is yours from {formatDateTime(startTime)} to{' '}
              {formatDateTime(endTime)}.
            </p>

            <div className="reserve__receipt">
              {(confirmed.specialRateName || (confirmed.discountPercent ?? 0) > 0) && (
                <div className="row row-wrap" style={{ gap: '0.4rem', marginBottom: '0.9rem' }}>
                  {confirmed.specialRateName && (
                    <span className="badge badge-accent">
                      <IconCalendar />
                      Event pricing: {confirmed.specialRateName}
                    </span>
                  )}
                  {(confirmed.discountPercent ?? 0) > 0 && (
                    <span className="badge badge-success">
                      <IconTag />
                      {formatPercent(confirmed.discountPercent ?? 0)} discount applied
                    </span>
                  )}
                </div>
              )}
              <div className="reserve__line">
                <span>{space.title} ({formatDuration(hours)})</span>
                <span>{formatMoney(confirmed.baseAmount, confirmed.currency)}</span>
              </div>
              <div className="reserve__line">
                <span>Service fee</span>
                <span>{formatMoney(confirmed.guestServiceFee, confirmed.currency)}</span>
              </div>
              {confirmed.tax > 0 && (
                <div className="reserve__line">
                  <span>Taxes</span>
                  <span>{formatMoney(confirmed.tax, confirmed.currency)}</span>
                </div>
              )}
              <div className="reserve__line reserve__line--total">
                <span>You paid</span>
                <span>{formatMoney(confirmed.totalCharged, confirmed.currency)}</span>
              </div>
              <p className="reserve__host-note">
                <IconInfo />
                {space.ownerEmail} receives {formatMoney(confirmed.hostPayout, confirmed.currency)} of this —
                ParkShare's service fee covers the rest.
              </p>
            </div>

            <div className="reserve__done-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                Back to dashboard
                <IconArrowRight />
              </button>
              <Link to="/listings" className="btn btn-secondary">
                Book another spot
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------------- form -- */

  return (
    <div className="page reserve">
      <Navbar backToDashboard />

      <div className="container">
        <Link to="/listings" className="reserve__back">
          <IconArrowLeft />
          All listings
        </Link>

        <header className="page-head">
          <div>
            <span className="page-head__eyebrow">
              <IconCar />
              Reserve a space
            </span>
            <h1 className="page-head__title">{space.title}</h1>
            <p className="page-head__sub">
              Pick your window, pay securely, and the spot is held in your name for exactly that
              time.
            </p>
          </div>
        </header>

        <div className="reserve__layout">
          {/* -------------------------------------------------------- form */}
          <form className="card card-pad reserve__form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="alert alert-danger" role="alert" style={{ marginBottom: '1.25rem' }}>
                <IconAlert />
                <span>{error}</span>
              </div>
            )}

            <section className="form-section">
              <div className="form-section__head">
                <h2 className="form-section__title">
                  <IconClock />
                  Your parking window
                </h2>
                <p className="form-section__sub">
                  Host availability: {formatDateTime(space.availableFrom)} →{' '}
                  {formatDateTime(space.availableTo)}
                </p>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label className="label" htmlFor="res-start">
                    Arriving
                  </label>
                  <input
                    id="res-start"
                    className="input"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="res-end">
                    Leaving
                  </label>
                  <input
                    id="res-end"
                    className="input"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    aria-invalid={hours <= 0}
                    required
                  />
                </div>
              </div>

              <div className="reserve__duration">
                <IconClock />
                {hours > 0 ? (
                  <>
                    <strong>{formatDuration(hours)}</strong> at{' '}
                    {formatMoney(space.pricePerHour, currency)}/hr
                  </>
                ) : (
                  'Choose a leaving time after your arrival time.'
                )}
              </div>

              {quoteError && (
                <div className="alert alert-danger" role="alert">
                  <IconAlert />
                  <span>{quoteError}</span>
                </div>
              )}
            </section>

            <section className="form-section">
              <div className="form-section__head">
                <h2 className="form-section__title">
                  <IconUser />
                  Who’s parking
                </h2>
              </div>

              <div className="field">
                <label className="label" htmlFor="res-email">
                  Email for the receipt
                </label>
                <div className="input-group">
                  <IconMail />
                  <input
                    id="res-email"
                    className="input"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section__head">
                <h2 className="form-section__title">
                  <IconCard />
                  Payment
                </h2>
                <p className="form-section__sub">
                  Handled entirely by Stripe — card details never reach ParkShare.
                </p>
              </div>

              <div className="field">
                <span className="label">Card details</span>
                <div className="reserve__card-field">
                  {/* Remount on theme change so Stripe picks up the new colours. */}
                  <CardElement key={resolved} options={cardOptions(resolved)} />
                </div>
              </div>

              <p className="reserve__secure">
                <IconLock />
                Encrypted end to end. You can cancel from your dashboard before the window starts.
              </p>
            </section>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={!stripe || submitting || hours <= 0 || !quote || quoteLoading}
            >
              {submitting ? (
                <>
                  <span className="spinner" />
                  Confirming…
                </>
              ) : quoteLoading ? (
                <>
                  <span className="spinner" />
                  Pricing your booking…
                </>
              ) : (
                <>
                  {quote ? `Pay ${formatMoney(quote.totalCharged, quote.currency)} and reserve` : 'Confirm reservation'}
                  <IconArrowRight />
                </>
              )}
            </button>
          </form>

          {/* ----------------------------------------------------- summary */}
          <aside className="reserve__aside">
            <div className="card card-pad reserve__summary">
              <div className="reserve__summary-head">
                <span className="reserve__summary-icon">
                  <IconCar />
                </span>
                <div>
                  <h2 className="reserve__summary-title">{space.title}</h2>
                  <span className="reserve__summary-host">
                    <IconUser />
                    {space.ownerEmail}
                  </span>
                </div>
              </div>

              {space.ownerEmail?.toLowerCase() !== (getEmail() || '').toLowerCase() && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm btn-block"
                  onClick={handleMessageHost}
                  disabled={messaging}
                  style={{ marginBottom: '0.9rem' }}
                >
                  <IconMessage />
                  {messaging ? 'Starting…' : 'Message host'}
                </button>
              )}
              {messageError && (
                <div className="alert alert-danger" role="alert" style={{ marginBottom: '0.9rem' }}>
                  <IconAlert />
                  <span>{messageError}</span>
                </div>
              )}

              {space.description && <p className="reserve__summary-desc">{space.description}</p>}

              {hours <= 0 ? (
                <div className="reserve__lines">
                  <div className="reserve__line">
                    <span>Hourly rate</span>
                    <span>{formatMoney(space.pricePerHour, currency)}</span>
                  </div>
                  <div className="reserve__line">
                    <span>Duration</span>
                    <span>—</span>
                  </div>
                </div>
              ) : quoteLoading && !quote ? (
                <div className="reserve__lines">
                  <span className="skeleton" style={{ height: '1rem' }} />
                  <span className="skeleton" style={{ height: '1rem' }} />
                  <span className="skeleton" style={{ height: '1.5rem' }} />
                </div>
              ) : quote ? (
                <>
                  {(quote.specialRateName || (quote.discountPercent ?? 0) > 0) && (
                    <div className="row row-wrap" style={{ gap: '0.4rem', marginBottom: '0.9rem' }}>
                      {quote.specialRateName && (
                        <span className="badge badge-accent">
                          <IconCalendar />
                          Event pricing: {quote.specialRateName}
                        </span>
                      )}
                      {(quote.discountPercent ?? 0) > 0 && (
                        <span className="badge badge-success">
                          <IconTag />
                          {formatPercent(quote.discountPercent ?? 0)} discount applied
                        </span>
                      )}
                    </div>
                  )}
                  <div className="reserve__lines">
                    <div className="reserve__line">
                      <span>
                        {quote.originalPricePerHour && quote.originalPricePerHour !== quote.pricePerHour && (
                          <s className="text-muted" style={{ marginRight: '0.4rem' }}>
                            {formatMoney(quote.originalPricePerHour, quote.currency)}
                          </s>
                        )}
                        {formatMoney(quote.pricePerHour, quote.currency)} × {formatDuration(quote.hours)}
                      </span>
                      <span>{formatMoney(quote.baseAmount, quote.currency)}</span>
                    </div>
                    <div className="reserve__line">
                      <span>Service fee ({formatPercent(quote.guestServiceFeeRate)})</span>
                      <span>{formatMoney(quote.guestServiceFee, quote.currency)}</span>
                    </div>
                    {quote.tax > 0 && (
                      <div className="reserve__line">
                        <span>Taxes ({formatPercent(quote.taxRate)})</span>
                        <span>{formatMoney(quote.tax, quote.currency)}</span>
                      </div>
                    )}
                    <div className="reserve__line reserve__line--total">
                      <span>Total</span>
                      <span>{formatMoney(quote.totalCharged, quote.currency)}</span>
                    </div>
                  </div>
                  <p className="reserve__fee-note">
                    <IconInfo />
                    Includes ParkShare's service fee. The host receives{' '}
                    {formatMoney(quote.hostPayout, quote.currency)}.
                  </p>
                </>
              ) : (
                <div className="reserve__lines">
                  <div className="reserve__line">
                    <span>Hourly rate</span>
                    <span>{formatMoney(space.pricePerHour, currency)}</span>
                  </div>
                </div>
              )}

              <ul className="reserve__assurances">
                <li>
                  <IconCheck />
                  The spot is reserved for your exact window
                </li>
                <li>
                  <IconShield />
                  Payment captured securely by Stripe
                </li>
                <li>
                  <IconPin />
                  Directions sent to your email
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
