import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Listings.css';
import Navbar from '../components/Navbar';

const containerStyle = { width: '100%', height: '500px' };
const initialCenter = { lat: 43.65107, lng: -79.347015 }; // Default to Toronto

const ParkingListings: React.FC = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'], // Add Places for autocomplete
  });

  const [listings, setListings] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    axios.get('http://localhost:8080/api/parking-spaces')
      .then(res => setListings(res.data))
      .catch(err => console.error(err));
  }, []);

  const navigate = useNavigate();


  // Initialize Places Autocomplete
  useEffect(() => {
    if (window.google && inputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          setMapCenter({ lat, lng });
          mapRef.current?.panTo({ lat, lng });
        }
      });
    }
  }, [isLoaded]);

  if (loadError) return <p>Error loading maps: {loadError.message}</p>;
  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <div className="listings-page">
      <Navbar backToDashboard />
      <h2 className="listings-heading">Live Parking Listings</h2>

      {/* City Search Input */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for a city"
        className="input"
        style={{ marginBottom: '1rem', width: '100%' }}
      />

      <div className="map-container">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={12}
          onLoad={(map) => {
            mapRef.current = map;
          }}
        >
          {listings.map(space => (
            <Marker
              key={space.id}
              position={{
                lat: space.location.coordinates[1],
                lng: space.location.coordinates[0]
              }}
              title={space.title}
              onClick={() => setSelected(space)}
            />
          ))}

          {selected && (
            <InfoWindow
              position={{
                lat: selected.location.coordinates[1],
                lng: selected.location.coordinates[0]
              }}
              onCloseClick={() => setSelected(null)}
            >
              <div className="info-window">
                <h3>{selected.title}</h3>
                <p>{selected.description}</p>
                <p>Price: ${selected.pricePerHour}/hr</p>
                <p>Owner: {selected.ownerEmail}</p>
                <button
                  className="reserve-button"
                  onClick={() => navigate(`/reserve/${selected.id}`)}
                >
                  Reserve
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default ParkingListings;
