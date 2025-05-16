import React, { useState } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';

const center = { lat: 43.65107, lng: -79.347015 }; 


const ParkingSpaceForm: React.FC = () => {
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '' });
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
      setMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marker) return alert("Please select a location on the map.");

    try {
        await axios.post('http://localhost:8080/api/parking-spaces', {
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

  <div style={{ marginBottom: '1rem' }}>
    <GoogleMap mapContainerStyle={{ width: '100%', height: '400px' }} center={center} zoom={12} onClick={handleMapClick}>
      {marker && <Marker position={marker} />}
    </GoogleMap>
  </div>

  <button type="submit" className="submit-button">Submit</button>
</form>
  );
};

export default ParkingSpaceForm;
