import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import axios from 'axios';
import './Listings.css';

const containerStyle = { width: '100%', height: '500px' };
const center = { lat: 43.65107, lng: -79.347015 };

const ParkingListings: React.FC = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''
  });

  const [listings, setListings] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    axios.get('http://localhost:8080/api/parking-spaces')
      .then(res => setListings(res.data))
      .catch(err => console.error(err));
  }, []);

  if (loadError) return <p>Error loading maps: {loadError.message}</p>;
  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <div className="listings-page">
      <h2 className="listings-heading">Live Parking Listings</h2>
      <div className="map-container">
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
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
                  onClick={() => alert(`Reserved: ${selected.title}`)}
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
