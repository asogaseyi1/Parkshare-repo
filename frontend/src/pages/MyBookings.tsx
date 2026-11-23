// src/pages/MyBookings.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import {
  IconAlert,
  IconCalendar,
  IconCar,
  IconClock,
  IconPin,
  IconUser,
} from '../components/Icons';
import { formatDateTime, formatMoney } from '../lib/format';
import { currencyForCountry } from '../types/ParkingSpace';
import { Reservation } from '../types/Reservation';
import './MyBookings.css';

type Tab = 'trips' | 'hosting';

const MyBookings: React.FC = () => {
  const [tab, setTab] = useState<Tab>('trips');
  const [trips, setTrips] = useState<Reservation[]>([]);
  const [hosting, setHosting] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([api.get('/reservations/mine'), api.get('/reservations/hosting')])
      .then(([mine, theirs]) => {
        if (!active) return;
        setTrips(Array.isArray(mine.data) ? mine.data : []);
        setHosting(Array.isArray(theirs.data) ? theirs.data : []);
      })
      .catch(() => active && setError('Couldn’t load your bookings.'))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const rows = tab === 'trips' ? trips : hosting;

  const canCancel = (reservation: Reservation) =>
    !reservation.cancelled && new Date(reservation.startTime).getTime() > Date.now();

  const handleCancel = (id: string) => {
    setCancellingId(id);
    setActionError('');

    api
      .post(`/reservations/${id}/cancel`)
      .then((res) => {
        const updated: Reservation = res.data;
        const patch = (list: Reservation[]) => list.map((r) => (r.id === id ? updated : r));
        setTrips(patch);
        setHosting(patch);
      })
      .catch((err) => setActionError(err?.response?.data?.message || 'Couldn’t cancel that booking.'))
      .finally(() => {
        setCancellingId(null);
        setConfirmingId(null);
      });
  };

  const emptyCopy = useMemo(
    () =>
      tab === 'trips'
        ? { title: 'No trips yet', text: 'Once you reserve a spot, it’ll show up here.' }
        : { title: 'No bookings on your listings yet', text: 'When a guest books one of your spaces, it’ll show up here.' },
    [tab]
  );

  return (
    <div className="page">
      <Navbar backToDashboard />

      <div className="container">
        <header className="page-head">
          <div>
            <span className="page-head__eyebrow">
              <IconCalendar />
              Bookings
            </span>
            <h1 className="page-head__title">Your bookings</h1>
            <p className="page-head__sub">Manage trips you’ve booked and bookings on your listings.</p>
          </div>
        </header>

        <div className="row" style={{ gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button type="button" className="chip" aria-pressed={tab === 'trips'} onClick={() => setTab('trips')}>
            Your trips
          </button>
          <button type="button" className="chip" aria-pressed={tab === 'hosting'} onClick={() => setTab('hosting')}>
            Hosting
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
            <IconAlert />
            <span>{error}</span>
          </div>
        )}
        {actionError && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
            <IconAlert />
            <span>{actionError}</span>
          </div>
        )}

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
        ) : rows.length === 0 ? (
          <div className="card card-pad">
            <div className="empty-state">
              <span className="empty-state__icon">
                <IconCar />
              </span>
              <p className="empty-state__title">{emptyCopy.title}</p>
              <p className="empty-state__text">{emptyCopy.text}</p>
              <Link to="/listings" className="btn btn-primary" style={{ marginTop: '0.6rem' }}>
                <IconPin />
                Find parking
              </Link>
            </div>
          </div>
        ) : (
          <div className="my-listings">
            {rows.map((reservation) => {
              const currency = currencyForCountry(reservation.parkingSpace?.country);
              const isPast = new Date(reservation.startTime).getTime() <= Date.now();
              const amount = tab === 'trips' ? reservation.totalCharged : reservation.hostPayout;
              const counterpart = tab === 'trips' ? reservation.hostEmail : reservation.userEmail;

              return (
                <article key={reservation.id} className="booking-row card">
                  <span className="listing-row__icon">
                    <IconCar />
                  </span>
                  <div className="listing-row__body">
                    <h3 className="listing-row__title">{reservation.parkingSpace?.title ?? 'Listing removed'}</h3>
                    <p className="listing-row__meta">
                      <IconClock />
                      {formatDateTime(reservation.startTime)} → {formatDateTime(reservation.endTime)}
                    </p>
                    <p className="listing-row__meta">
                      <IconUser />
                      {counterpart}
                    </p>
                    <div className="row" style={{ gap: '0.4rem', marginTop: '0.4rem' }}>
                      {reservation.cancelled ? (
                        <span className="badge badge-danger">Cancelled</span>
                      ) : isPast ? (
                        <span className="badge">Completed</span>
                      ) : (
                        <span className="badge badge-success">Upcoming</span>
                      )}
                      {reservation.cancelled && reservation.refundAmount ? (
                        <span className="badge badge-accent">
                          Refunded {formatMoney(reservation.refundAmount, currency)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="booking-row__end">
                    <span className="listing-row__price">
                      {formatMoney(amount, currency)}
                      <small>{tab === 'trips' ? 'paid' : 'payout'}</small>
                    </span>

                    {canCancel(reservation) &&
                      (confirmingId === reservation.id ? (
                        <div className="row" style={{ gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={cancellingId === reservation.id}
                            onClick={() => handleCancel(reservation.id)}
                          >
                            {cancellingId === reservation.id ? 'Cancelling…' : 'Confirm cancel'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setConfirmingId(null)}
                            disabled={cancellingId === reservation.id}
                          >
                            Keep it
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirmingId(reservation.id)}
                        >
                          Cancel booking
                        </button>
                      ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
