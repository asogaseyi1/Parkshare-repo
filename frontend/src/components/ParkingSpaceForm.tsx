import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const ParkingSpaceForm: React.FC = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'], // Needed for city autocomplete
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [center, setCenter] = useState({ lat: 43.65107, lng: -79.347015 }); // Toronto
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);

  const [form, setForm] = useState({
    ownerEmail: '',
    title: '',
    description: '',
    pricePerHour: '',
    availableFrom: '',
    availableTo: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
    }
  };

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marker) return alert("Please select a location on the map.");

    try {
      await API.post('/api/parking-spaces', {
        ...form,
        pricePerHour: parseFloat(form.pricePerHour),
        location: { type: "Point", coordinates: [marker.lng, marker.lat] },
      });
      alert("Parking space created!");
      navigate('/dashboard'); // redirect after creation
    } catch (err) {
      console.error(err);
      alert("Failed to create parking space.");
    }
  };

  // Initialize Places Autocomplete for city search
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
          setCenter({ lat, lng });
          setMarker({ lat, lng });
          mapRef.current?.panTo({ lat, lng });
        }
      });
    }
  }, [isLoaded]);

  if (loadError) return <p>Failed to load Google Maps</p>;
  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <form onSubmit={handleSubmit} className="parking-form">
      <input name="ownerEmail" placeholder="Your Email" onChange={handleChange} required className="input" />
      <input name="title" placeholder="Title" onChange={handleChange} required className="input" />
      <textarea name="description" placeholder="Description" onChange={handleChange} className="input" />
      <input name="pricePerHour" placeholder="Price per Hour" type="number" onChange={handleChange} required className="input" />
      <input name="availableFrom" type="datetime-local" onChange={handleChange} required className="input" />
      <input name="availableTo" type="datetime-local" onChange={handleChange} required className="input" />

      {/* City Search Input */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for a city"
        className="input"
        style={{ marginBottom: '1rem', width: '100%' }}
      />

      {/* Google Map */}
      <div style={{ marginBottom: '1rem' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '400px' }}
          center={center}
          zoom={12}
          onClick={handleMapClick}
          onLoad={(map) => {
            mapRef.current = map;
          }}
        >
          {marker && <Marker position={marker} />}
        </GoogleMap>
      </div>

      <button type="submit" className="submit-button">Submit</button>
    </form>
  );
};

export default ParkingSpaceForm;
