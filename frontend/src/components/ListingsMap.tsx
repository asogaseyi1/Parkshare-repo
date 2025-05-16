// src/components/ListingsMap.tsx
import React from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { ParkingSpace } from '../types/ParkingSpace';

type ListingsMapProps = {
  listings: ParkingSpace[];
};

const containerStyle = {
  width: '100%',
  height: '500px',
};

const center = {
  lat: 43.65107,  // Default center (Toronto)
  lng: -79.347015,
};

const ListingsMap: React.FC<ListingsMapProps> = ({ listings }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
  });

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={{
            lat: listing.location.coordinates[1], // Latitude
            lng: listing.location.coordinates[0], // Longitude
          }}
          title={listing.title}
        />
      ))}
    </GoogleMap>
  );
};

export default ListingsMap;
