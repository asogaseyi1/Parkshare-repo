import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import {
  IconAlert,
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconMail,
  IconPlus,
  IconTag,
  IconTrash,
  IconUser,
} from '../components/Icons';
import { formatDateTime, formatMoney, nextQuarterHourLocal } from '../lib/format';
import {
  currencyForCountry,
  ParkingSpace,
  SpecialRate,
  SpecialRateRequest,
  UserDiscount,
  UserDiscountRequest,
} from '../types/ParkingSpace';
import './ManageListing.css';

const ManageListing: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [space, setSpace] = useState<ParkingSpace | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [rates, setRates] = useState<SpecialRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [rateForm, setRateForm] = useState({
    name: '',
    startTime: nextQuarterHourLocal(),
    endTime: nextQuarterHourLocal(5),
    pricePerHour: '',
  });
  const [rateError, setRateError] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  const [discounts, setDiscounts] = useState<UserDiscount[]>([]);
  const [discountsLoading, setDiscountsLoading] = useState(true);
  const [discountForm, setDiscountForm] = useState({ guestEmail: '', percentOff: '' });
  const [discountError, setDiscountError] = useState('');
  const [savingDiscount, setSavingDiscount] = useState(false);

  const currency = currencyForCountry(space?.country);

  useEffect(() => {
    if (!id) {
      setLoadFailed(true);
      setLoading(false);
      return;
    }
    let active = true;
    api
      .get(`/parking-spaces/${id}`)
      .then((res) => active && setSpace(res.data))
      .catch(() => active && setLoadFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const loadRates = () => {
    if (!id) return;
    setRatesLoading(true);
    api
      .get(`/parking-spaces/${id}/special-rates`)
      .then((res) => setRates(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setRatesLoading(false));
  };

  const loadDiscounts = () => {
    if (!id) return;
    setDiscountsLoading(true);
    api
      .get(`/parking-spaces/${id}/discounts`)
      .then((res) => setDiscounts(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setDiscountsLoading(false));
  };

  useEffect(() => {
    loadRates();
    loadDiscounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRateError('');

    const price = parseFloat(rateForm.pricePerHour);
    if (!rateForm.name.trim()) {
      setRateError('Give this event a name.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setRateError('Enter a rate greater than zero.');
      return;
    }
    if (new Date(rateForm.endTime).getTime() <= new Date(rateForm.startTime).getTime()) {
      setRateError('End time must be after start time.');
      return;
    }

    setSavingRate(true);
    try {
      const payload: SpecialRateRequest = {
        name: rateForm.name,
        startTime: rateForm.startTime,
        endTime: rateForm.endTime,
        pricePerHour: price,
      };
      await api.post(`/parking-spaces/${id}/special-rates`, payload);
      setRateForm({ name: '', startTime: nextQuarterHourLocal(), endTime: nextQuarterHourLocal(5), pricePerHour: '' });
      loadRates();
    } catch (err: any) {
      setRateError(err?.response?.data?.message || 'Could not save this event rate.');
    } finally {
      setSavingRate(false);
    }
  };

  const handleDeleteRate = async (rateId: string) => {
    const previous = rates;
    setRates((prev) => prev.filter((r) => r.id !== rateId));
    try {
      await api.delete(`/parking-spaces/${id}/special-rates/${rateId}`);
    } catch {
      setRates(previous); // restore on failure rather than silently drift from the server
    }
  };

  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError('');

    const percent = parseFloat(discountForm.percentOff);
    if (!discountForm.guestEmail.trim()) {
      setDiscountError("Enter the guest's email.");
      return;
    }
    if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) {
      setDiscountError('Enter a discount between 1 and 90%.');
      return;
    }

    setSavingDiscount(true);
    try {
      const payload: UserDiscountRequest = { guestEmail: discountForm.guestEmail, percentOff: percent };
      await api.post(`/parking-spaces/${id}/discounts`, payload);
      setDiscountForm({ guestEmail: '', percentOff: '' });
      loadDiscounts();
    } catch (err: any) {
      setDiscountError(err?.response?.data?.message || 'Could not save this discount.');
    } finally {
      setSavingDiscount(false);
    }
  };

  const handleDeleteDiscount = async (discountId: string) => {
    const previous = discounts;
    setDiscounts((prev) => prev.filter((d) => d.id !== discountId));
    try {
      await api.delete(`/parking-spaces/${id}/discounts/${discountId}`);
    } catch {
      setDiscounts(previous);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Navbar backToDashboard />
        <div className="loading-pane">
          <span className="spinner spinner-lg" />
          Loading listing…
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
              <p className="empty-state__title">We couldn’t find that listing</p>
              <p className="empty-state__text">It may have been removed, or you don’t own it.</p>
              <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '0.6rem' }}>
                <IconArrowLeft />
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page manage-listing">
      <Navbar backToDashboard />
      <div className="container">
        <Link to="/dashboard" className="manage-listing__back">
          <IconArrowLeft />
          Dashboard
        </Link>

        <header className="page-head">
          <div>
            <span className="page-head__eyebrow">
              <IconCalendar />
              Manage listing
            </span>
            <h1 className="page-head__title">{space.title}</h1>
            <p className="page-head__sub">
              Set event pricing for a specific window, or grant a guest a standing discount. Both
              apply automatically at checkout.
            </p>
          </div>
        </header>

        <div className="manage-listing__grid">
          {/*  event rates */}
          <section className="card card-pad">
            <div className="form-section__head">
              <h2 className="form-section__title">
                <IconCalendar />
                Event pricing
              </h2>
              <p className="form-section__sub">
                Charge a different rate for a specific window — a concert, a game, a holiday
                weekend.
              </p>
            </div>

            {rateError && (
              <div className="alert alert-danger" role="alert">
                <IconAlert />
                <span>{rateError}</span>
              </div>
            )}

            <form onSubmit={handleAddRate} className="manage-listing__form">
              <div className="field">
                <label className="label" htmlFor="rate-name">
                  Event name
                </label>
                <input
                  id="rate-name"
                  className="input"
                  placeholder="e.g. Leafs home game"
                  value={rateForm.name}
                  onChange={(e) => setRateForm({ ...rateForm, name: e.target.value })}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label className="label" htmlFor="rate-start">
                    Starts
                  </label>
                  <input
                    id="rate-start"
                    className="input"
                    type="datetime-local"
                    value={rateForm.startTime}
                    onChange={(e) => setRateForm({ ...rateForm, startTime: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="rate-end">
                    Ends
                  </label>
                  <input
                    id="rate-end"
                    className="input"
                    type="datetime-local"
                    value={rateForm.endTime}
                    onChange={(e) => setRateForm({ ...rateForm, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="field">
                <label className="label" htmlFor="rate-price">
                  Rate during this window
                  <span className="label__hint">{currency}</span>
                </label>
                <input
                  id="rate-price"
                  className="input"
                  type="number"
                  min="0.5"
                  step="0.25"
                  placeholder={String(space.pricePerHour * 2)}
                  value={rateForm.pricePerHour}
                  onChange={(e) => setRateForm({ ...rateForm, pricePerHour: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={savingRate}>
                {savingRate ? (
                  <>
                    <span className="spinner" />
                    Saving…
                  </>
                ) : (
                  <>
                    <IconPlus />
                    Add event rate
                  </>
                )}
              </button>
            </form>

            <div className="manage-listing__list">
              {ratesLoading ? (
                <span className="skeleton" style={{ display: 'block', height: '3rem' }} />
              ) : rates.length === 0 ? (
                <p className="text-sm text-muted">
                  No event rates yet — bookings use your normal rate of{' '}
                  {formatMoney(space.pricePerHour, currency)}/hr.
                </p>
              ) : (
                rates.map((rate) => (
                  <div key={rate.id} className="manage-listing__row">
                    <div className="manage-listing__row-body">
                      <strong>{rate.name}</strong>
                      <p className="manage-listing__row-meta">
                        <IconClock />
                        {formatDateTime(rate.startTime)} → {formatDateTime(rate.endTime)}
                      </p>
                    </div>
                    <span className="badge badge-primary">
                      {formatMoney(rate.pricePerHour, currency)}/hr
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleDeleteRate(rate.id)}
                      aria-label={`Delete event rate ${rate.name}`}
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/*  discounts */}
          <section className="card card-pad">
            <div className="form-section__head">
              <h2 className="form-section__title">
                <IconTag />
                Guest discounts
              </h2>
              <p className="form-section__sub">
                Reward a specific guest with a standing discount at this listing.
              </p>
            </div>

            {discountError && (
              <div className="alert alert-danger" role="alert">
                <IconAlert />
                <span>{discountError}</span>
              </div>
            )}

            <form onSubmit={handleAddDiscount} className="manage-listing__form">
              <div className="field">
                <label className="label" htmlFor="discount-email">
                  Guest email
                </label>
                <div className="input-group">
                  <IconMail />
                  <input
                    id="discount-email"
                    className="input"
                    type="email"
                    placeholder="jane@example.com"
                    value={discountForm.guestEmail}
                    onChange={(e) => setDiscountForm({ ...discountForm, guestEmail: e.target.value })}
                  />
                </div>
                <span className="text-xs text-muted">They need a ParkShare account already.</span>
              </div>
              <div className="field">
                <label className="label" htmlFor="discount-percent">
                  Discount
                </label>
                <input
                  id="discount-percent"
                  className="input"
                  type="number"
                  min="1"
                  max="90"
                  step="1"
                  placeholder="15"
                  value={discountForm.percentOff}
                  onChange={(e) => setDiscountForm({ ...discountForm, percentOff: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={savingDiscount}>
                {savingDiscount ? (
                  <>
                    <span className="spinner" />
                    Saving…
                  </>
                ) : (
                  <>
                    <IconPlus />
                    Add discount
                  </>
                )}
              </button>
            </form>

            <div className="manage-listing__list">
              {discountsLoading ? (
                <span className="skeleton" style={{ display: 'block', height: '3rem' }} />
              ) : discounts.length === 0 ? (
                <p className="text-sm text-muted">No discounts granted yet.</p>
              ) : (
                discounts.map((discount) => (
                  <div key={discount.id} className="manage-listing__row">
                    <div className="manage-listing__row-body">
                      <p className="manage-listing__row-meta manage-listing__row-meta--primary">
                        <IconUser />
                        {discount.guestEmail}
                      </p>
                    </div>
                    <span className="badge badge-success">{discount.percentOff}% off</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleDeleteDiscount(discount.id)}
                      aria-label={`Remove discount for ${discount.guestEmail}`}
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ManageListing;
