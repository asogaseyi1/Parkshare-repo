import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GoogleMap, InfoWindow, Marker, useLoadScript } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import useTheme from '../hooks/useTheme';
import { mapOptions, priceMarkerIcon } from '../styles/mapStyles';
import {
  IconAlert,
  IconArrowRight,
  IconCar,
  IconClock,
  IconMap,
  IconMessage,
  IconPin,
  IconSearch,
  IconUser,
} from '../components/Icons';
import { getEmail } from '../lib/session';
import { formatDateTime, formatMoney } from '../lib/format';
import { currencyForCountry, ParkingSpace } from '../types/ParkingSpace';
import './Listings.css';

const containerStyle = { width: '100%', height: '100%' };
const initialCenter = { lat: 43.65107, lng: -79.347015 }; // Toronto
const libraries: 'places'[] = ['places'];

type SortKey = 'price-asc' | 'price-desc' | 'newest';

const sorts: { key: SortKey; label: string }[] = [
  { key: 'price-asc', label: 'Cheapest' },
  { key: 'price-desc', label: 'Priciest' },
  { key: 'newest', label: 'Newest' },
];

const coordsOf = (space: ParkingSpace) => {
  const pair = space?.location?.coordinates;
  if (!Array.isArray(pair) || pair.length < 2) return null;
  const [lng, lat] = pair;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { lat, lng };
};

/** Straight-line distance in km — enough to order "what's close by". */
const distanceKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

const formatDistance = (km: number) =>
  km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;

const ParkingListings: React.FC = () => {
  const { resolved } = useTheme();
  const navigate = useNavigate();
  const myEmail = (getEmail() || '').toLowerCase();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [listings, setListings] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('price-asc');
  const [mapCenter, setMapCenter] = useState(initialCenter);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    let active = true;

    api
      .get('/parking-spaces')
      .then((res) => {
        if (!active) return;
        const rows: ParkingSpace[] = (Array.isArray(res.data) ? res.data : []).map((item: any) => ({
          ...item,
          // The API returns `id`; keep `_id` as a fallback for raw Mongo documents.
          id: item.id ?? item._id,
        }));
        setListings(rows);
      })
      .catch(() => active && setFetchError('We couldn’t load listings. Is the backend running?'))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  // City autocomplete — re-centres the map on the chosen place.
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
        setMapCenter(next);
        mapRef.current?.panTo(next);
      }
    });

    return () => listener.remove();
  }, [isLoaded]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = listings.filter((space) => {
      if (!needle) return true;
      return [space.title, space.description, space.ownerEmail]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });

    return [...rows].sort((a, b) => {
      if (sort === 'price-asc') return (a.pricePerHour ?? 0) - (b.pricePerHour ?? 0);
      if (sort === 'price-desc') return (b.pricePerHour ?? 0) - (a.pricePerHour ?? 0);
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [listings, query, sort]);

  const selected = useMemo(
    () => visible.find((space) => space.id === selectedId) ?? null,
    [visible, selectedId]
  );

  const select = useCallback((space: ParkingSpace, pan = true) => {
    setSelectedId(space.id);
    const coords = coordsOf(space);
    if (pan && coords) mapRef.current?.panTo(coords);
    cardRefs.current[space.id]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  const messageHost = useCallback(
    (space: ParkingSpace) => {
      api
        .post('/conversations', { parkingSpaceId: space.id })
        .then((res) => navigate(`/messages?conversationId=${res.data.id}`))
        .catch(() => setFetchError('Couldn’t start that conversation. Try again.'));
    },
    [navigate]
  );

  const priceRange = useMemo(() => {
    const prices = listings.map((space) => Number(space.pricePerHour) || 0).filter((p) => p > 0);
    if (prices.length === 0) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [listings]);

  /* ------------------------------------------------------------ map pane --- */

  const renderMap = () => {
    if (loadError || !process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
      return (
        <div className="map-fallback">
          <div className="empty-state">
            <span className="empty-state__icon">
              <IconMap />
            </span>
            <p className="empty-state__title">Map unavailable</p>
            <p className="empty-state__text">
              {loadError
                ? 'Google Maps failed to load. Check the API key and its referrer restrictions.'
                : 'Set REACT_APP_GOOGLE_MAPS_API_KEY in your environment to show the map. The list beside this panel still works.'}
            </p>
          </div>
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div className="map-fallback">
          <span className="spinner spinner-lg" />
          <p className="text-sm text-muted" style={{ marginTop: '1rem' }}>
            Loading map…
          </p>
        </div>
      );
    }

    return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={12}
        options={mapOptions(resolved)}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        onClick={() => setSelectedId(null)}
      >
        {visible.map((space) => {
          const coords = coordsOf(space);
          if (!coords) return null;
          return (
            <Marker
              key={space.id}
              position={coords}
              title={space.title}
              zIndex={space.id === selectedId ? 10 : 1}
              icon={priceMarkerIcon(
                Number(space.pricePerHour) || 0,
                space.id === selectedId,
                currencyForCountry(space.country)
              )}
              onClick={() => select(space, false)}
            />
          );
        })}

        {selected && coordsOf(selected) && (
          <InfoWindow
            position={coordsOf(selected)!}
            onCloseClick={() => setSelectedId(null)}
            options={{ pixelOffset: new google.maps.Size(0, -38) }}
          >
            <div className="info-window">
              <h3 className="info-window__title">{selected.title}</h3>
              {selected.description && (
                <p className="info-window__text">{selected.description}</p>
              )}
              <div className="info-window__meta">
                <span>
                  <IconClock />
                  Until {formatDateTime(selected.availableTo)}
                </span>
                <span>
                  <IconUser />
                  {selected.ownerEmail}
                </span>
              </div>
              <div className="info-window__foot">
                <span className="info-window__price">
                  {formatMoney(selected.pricePerHour, currencyForCountry(selected.country))}
                  <small>/hr</small>
                </span>
                <div className="row" style={{ gap: '0.4rem' }}>
                  {selected.ownerEmail?.toLowerCase() !== myEmail && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => messageHost(selected)}
                    >
                      <IconMessage />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/reserve/${selected.id}`)}
                  >
                    Reserve
                    <IconArrowRight />
                  </button>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    );
  };

  /* ------------------------------------------------------------------ view - */

  return (
    <div className="page listings">
      <Navbar backToDashboard />

      <div className="container container-wide">
        <header className="listings__head">
          <div>
            <span className="eyebrow">
              <span className="live-dot" aria-hidden="true" />
              Live inventory
            </span>
            <h1 className="listings__title">Find parking</h1>
            <p className="listings__sub">
              {loading
                ? 'Loading nearby spaces…'
                : `${listings.length} space${listings.length === 1 ? '' : 's'} listed${
                    priceRange
                      ? ` · ${formatMoney(priceRange.min)}–${formatMoney(priceRange.max)} per hour`
                      : ''
                  }`}
            </p>
          </div>

          <div className="listings__tools">
            <div className="input-group listings__search">
              <IconSearch />
              <input
                ref={inputRef}
                type="text"
                className="input"
                placeholder="Search a city to re-centre the map"
                aria-label="Search for a city"
              />
            </div>
            <div className="input-group listings__search">
              <IconPin />
              <input
                type="search"
                className="input"
                placeholder="Filter by title, description or host"
                aria-label="Filter listings"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {fetchError && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
            <IconAlert />
            <span>{fetchError}</span>
          </div>
        )}

        <div className="listings__layout">
          {/* ------------------------------------------------------ sidebar */}
          <aside className="listings__panel card">
            <div className="listings__panel-head">
              <span className="text-xs text-muted">
                {loading ? 'Loading…' : `${visible.length} result${visible.length === 1 ? '' : 's'}`}
              </span>
              <div className="row" style={{ gap: '0.35rem' }}>
                {sorts.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className="chip"
                    aria-pressed={sort === option.key}
                    onClick={() => setSort(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="listings__scroll">
              {loading ? (
                [0, 1, 2, 3].map((index) => (
                  <div key={index} className="spot-card spot-card--skeleton">
                    <span className="skeleton" style={{ height: '1rem', width: '60%' }} />
                    <span className="skeleton" style={{ height: '0.75rem', width: '85%' }} />
                    <span className="skeleton" style={{ height: '0.75rem', width: '40%' }} />
                  </div>
                ))
              ) : visible.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state__icon">
                    <IconCar />
                  </span>
                  <p className="empty-state__title">
                    {listings.length === 0 ? 'No spaces listed yet' : 'Nothing matches that filter'}
                  </p>
                  <p className="empty-state__text">
                    {listings.length === 0
                      ? 'Be the first host in your neighbourhood — listing a space takes about two minutes.'
                      : 'Try a different word, or clear the filter to see everything again.'}
                  </p>
                  {listings.length > 0 && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setQuery('')}>
                      Clear filter
                    </button>
                  )}
                </div>
              ) : (
                visible.map((space) => {
                  const coords = coordsOf(space);
                  const isSelected = space.id === selectedId;

                  return (
                    <article
                      key={space.id}
                      ref={(node) => {
                        cardRefs.current[space.id] = node;
                      }}
                      className={`spot-card ${isSelected ? 'spot-card--selected' : ''}`}
                      onClick={() => select(space)}
                      onKeyDown={(e) => {
                        // Only react to the card itself, not the Reserve button inside it.
                        if (e.target !== e.currentTarget) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          select(space);
                        }
                      }}
                      tabIndex={0}
                    >
                      <div className="spot-card__top">
                        <span className="spot-card__icon">
                          <IconCar />
                        </span>
                        <div className="spot-card__heading">
                          <h3 className="spot-card__title">{space.title}</h3>
                          <span className="spot-card__distance">
                            <IconPin />
                            {coords ? formatDistance(distanceKm(mapCenter, coords)) : 'Location pending'}
                          </span>
                        </div>
                        <span className="spot-card__price">
                          {formatMoney(space.pricePerHour, currencyForCountry(space.country))}
                          <small>/hr</small>
                        </span>
                      </div>

                      {space.description && (
                        <p className="spot-card__desc">{space.description}</p>
                      )}

                      <div className="spot-card__tags">
                        <span className="badge">
                          <IconClock />
                          {formatDateTime(space.availableFrom)} → {formatDateTime(space.availableTo)}
                        </span>
                      </div>

                      <div className="spot-card__foot">
                        <span className="spot-card__host">
                          <IconUser />
                          {space.ownerEmail}
                        </span>
                        <div className="row" style={{ gap: '0.4rem' }}>
                          {space.ownerEmail?.toLowerCase() !== myEmail && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                messageHost(space);
                              }}
                            >
                              <IconMessage />
                              Message
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/reserve/${space.id}`);
                            }}
                          >
                            Reserve
                            <IconArrowRight />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </aside>

          {/* ---------------------------------------------------------- map */}
          <div className="listings__map card">{renderMap()}</div>
        </div>
      </div>
    </div>
  );
};

export default ParkingListings;
