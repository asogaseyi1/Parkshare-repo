import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useTheme from '../hooks/useTheme';
import { mapOptions, pinMarkerIcon } from '../styles/mapStyles';
import {
  IconAlert,
  IconArrowRight,
  IconCar,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconInfo,
  IconMail,
  IconPin,
  IconSearch,
  IconSparkle,
  IconTrend,
  IconWallet,
} from './Icons';
import { getEmail } from '../lib/session';
import { formatMoney, nextQuarterHourLocal } from '../lib/format';
import { SUPPORTED_COUNTRIES } from '../types/ParkingSpace';

const libraries: 'places'[] = ['places'];
const initialCenter = { lat: 43.65107, lng: -79.347015 }; // Toronto

type LatLng = { lat: number; lng: number };

const ParkingSpaceForm: React.FC = () => {
  const { resolved } = useTheme();
  const navigate = useNavigate();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [center, setCenter] = useState(initialCenter);
  const [marker, setMarker] = useState<LatLng | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    ownerEmail: getEmail() || '',
    title: '',
    description: '',
    country: SUPPORTED_COUNTRIES[0].code,
    pricePerHour: '',
    availableFrom: nextQuarterHourLocal(),
    availableTo: nextQuarterHourLocal(8),
  });

  const currency =
    SUPPORTED_COUNTRIES.find((c) => c.code === form.country)?.currency ?? 'CAD';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) setMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  };

  // City autocomplete — centres the map and drops a starting pin.
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['(cities)'],
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const next = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCenter(next);
        setMarker(next);
        mapRef.current?.panTo(next);
      }
    });

    return () => listener.remove();
  }, [isLoaded]);

  const price = parseFloat(form.pricePerHour);
  const monthlyEstimate = Number.isFinite(price) ? price * 5 * 14 : 0;

  const windowHours = useMemo(() => {
    const from = new Date(form.availableFrom).getTime();
    const to = new Date(form.availableTo).getTime();
    if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return 0;
    return (to - from) / 3_600_000;
  }, [form.availableFrom, form.availableTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!marker) {
      setError('Drop a pin on the map so drivers know where to go.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter an hourly rate greater than zero.');
      return;
    }
    if (windowHours <= 0) {
      setError('The “available until” time has to come after the “available from” time.');
      return;
    }

    setSaving(true);

    try {
      await api.post('/parking-spaces', {
        ...form,
        pricePerHour: price,
        location: { type: 'Point', coordinates: [marker.lng, marker.lat] },
      });
      setSaved(true);
      setTimeout(() => navigate('/dashboard'), 1100);
    } catch {
      setError('We couldn’t save this listing. Please check your details and try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------- map pane -- */

  const renderMap = () => {
    if (loadError || !process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
      return (
        <div className="create__map-fallback">
          <IconInfo />
          <p>
            {loadError
              ? 'Google Maps failed to load, so a pin can’t be placed right now.'
              : 'Set REACT_APP_GOOGLE_MAPS_API_KEY to pick a location on the map.'}
          </p>
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div className="create__map-fallback">
          <span className="spinner spinner-lg" />
        </div>
      );
    }

    return (
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={13}
        options={mapOptions(resolved)}
        onClick={handleMapClick}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {marker && <Marker position={marker} icon={pinMarkerIcon()} />}
      </GoogleMap>
    );
  };

  /* ------------------------------------------------------------------ view - */

  if (saved) {
    return (
      <div className="card card-pad create__success">
        <span className="create__success-icon">
          <IconCheckCircle />
        </span>
        <h2>Your space is live</h2>
        <p className="text-muted">
          {form.title || 'Your listing'} is now on the map at {formatMoney(price, currency)}/hr. Taking
          you back to your dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="create__layout">
      <form onSubmit={handleSubmit} className="card card-pad parking-form" noValidate>
        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '1.25rem' }}>
            <IconAlert />
            <span>{error}</span>
          </div>
        )}

        {/* --------------------------------------------------- spot details */}
        <section className="form-section">
          <div className="form-section__head">
            <h2 className="form-section__title">
              <IconCar />
              About the space
            </h2>
            <p className="form-section__sub">
              Give drivers the details they need to find it and trust it.
            </p>
          </div>

          <div className="field">
            <label className="label" htmlFor="ps-title">
              Listing title
            </label>
            <input
              id="ps-title"
              className="input"
              name="title"
              placeholder="e.g. Private driveway, 2 min from Union"
              value={form.title}
              onChange={handleChange}
              maxLength={80}
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="ps-description">
              Description
              <span className="label__hint">Optional</span>
            </label>
            <textarea
              id="ps-description"
              className="textarea"
              name="description"
              placeholder="Width, surface, how to get in, anything a driver should know before they arrive."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="ps-email">
              Your email
              <span className="label__hint">Shown to drivers who book</span>
            </label>
            <div className="input-group">
              <IconMail />
              <input
                id="ps-email"
                className="input"
                name="ownerEmail"
                type="email"
                placeholder="you@example.com"
                value={form.ownerEmail}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------ pricing + availability */}
        <section className="form-section">
          <div className="form-section__head">
            <h2 className="form-section__title">
              <IconWallet />
              Rate and availability
            </h2>
            <p className="form-section__sub">You can change these at any time.</p>
          </div>

          <div className="field">
            <label className="label" htmlFor="ps-country">
              Country
              <span className="label__hint">Sets your currency and tax rate</span>
            </label>
            <select
              id="ps-country"
              className="select"
              name="country"
              value={form.country}
              onChange={handleChange}
              required
            >
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.currency})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="ps-price">
              Price per hour
              <span className="label__hint">{currency}</span>
            </label>
            <input
              id="ps-price"
              className="input"
              name="pricePerHour"
              type="number"
              min="0.5"
              step="0.25"
              inputMode="decimal"
              placeholder="3.00"
              value={form.pricePerHour}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="label" htmlFor="ps-from">
                Available from
              </label>
              <input
                id="ps-from"
                className="input"
                name="availableFrom"
                type="datetime-local"
                value={form.availableFrom}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="ps-to">
                Available until
              </label>
              <input
                id="ps-to"
                className="input"
                name="availableTo"
                type="datetime-local"
                value={form.availableTo}
                onChange={handleChange}
                aria-invalid={windowHours <= 0}
                required
              />
              {windowHours > 0 && (
                <span className="text-xs text-muted">
                  {windowHours.toFixed(windowHours % 1 === 0 ? 0 : 1)} hour window
                </span>
              )}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- location */}
        <section className="form-section">
          <div className="form-section__head">
            <h2 className="form-section__title">
              <IconPin />
              Where is it?
            </h2>
            <p className="form-section__sub">
              Search for your city, then click the map to drop a pin on the exact spot.
            </p>
          </div>

          <div className="input-group">
            <IconSearch />
            <input
              ref={inputRef}
              type="text"
              className="input"
              placeholder="Search for a city"
              aria-label="Search for a city"
            />
          </div>

          <div className="create__map">{renderMap()}</div>

          <div className={`create__coords ${marker ? 'is-set' : ''}`}>
            {marker ? (
              <>
                <IconCheck />
                Pin set at {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMarker(null)}
                  style={{ marginLeft: 'auto' }}
                >
                  Clear
                </button>
              </>
            ) : (
              <>
                <IconInfo />
                No pin yet — click the map to place one.
              </>
            )}
          </div>
        </section>

        <div className="create__actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner" />
                Publishing…
              </>
            ) : (
              <>
                Publish listing
                <IconArrowRight />
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/dashboard')}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* --------------------------------------------------- live preview --- */}
      <aside className="create__aside">
        <div className="card card-pad create__preview">
          <span className="badge badge-primary">
            <IconSparkle />
            Live preview
          </span>

          <div className="create__preview-card">
            <div className="create__preview-head">
              <span className="create__preview-icon">
                <IconCar />
              </span>
              <div style={{ minWidth: 0 }}>
                <h3 className="create__preview-title">
                  {form.title || 'Your listing title'}
                </h3>
                <span className="create__preview-meta">
                  <IconPin />
                  {marker ? 'Pin placed' : 'Location not set'}
                </span>
              </div>
              <span className="create__preview-price">
                {Number.isFinite(price) && price > 0 ? formatMoney(price, currency) : '$—'}
                <small>/hr</small>
              </span>
            </div>

            <p className="create__preview-desc">
              {form.description || 'Your description will appear here for drivers to read.'}
            </p>

            <span className="badge">
              <IconClock />
              {windowHours > 0
                ? `${windowHours.toFixed(windowHours % 1 === 0 ? 0 : 1)} hrs available`
                : 'Set your availability'}
            </span>
          </div>

          <div className="create__estimate">
            <span className="create__estimate-label">
              <IconTrend />
              Monthly potential
            </span>
            <strong className="create__estimate-value">
              {monthlyEstimate > 0 ? formatMoney(monthlyEstimate, currency) : '—'}
            </strong>
            <span className="text-xs text-muted">
              At 5 rented hours a day, 14 days a month, before ParkShare's host service fee. Just an
              estimate — you set the real hours.
            </span>
          </div>
        </div>

        <div className="card card-pad create__tips">
          <h3 className="create__tips-title">Listings that get booked</h3>
          <ul>
            <li>
              <IconCheck />
              Name a landmark drivers search for
            </li>
            <li>
              <IconCheck />
              Say whether it fits an SUV
            </li>
            <li>
              <IconCheck />
              Price within a dollar of nearby spots
            </li>
            <li>
              <IconCheck />
              Keep your availability window honest
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default ParkingSpaceForm;
