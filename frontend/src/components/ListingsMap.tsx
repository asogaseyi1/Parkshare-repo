// src/components/ListingsMap.tsx
import React from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import useTheme from '../hooks/useTheme';
import { mapOptions, priceMarkerIcon } from '../styles/mapStyles';
import { ParkingSpace } from '../types/ParkingSpace';

type ListingsMapProps = {
  listings: ParkingSpace[];
  /** Optional map centre; defaults to downtown Toronto. */
  center?: { lat: number; lng: number };
  onSelect?: (listing: ParkingSpace) => void;
};

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 43.65107,
  lng: -79.347015,
};

const ListingsMap: React.FC<ListingsMapProps> = ({ listings, center, onSelect }) => {
  const { resolved } = useTheme();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string,
  });

  if (!isLoaded) {
    return (
      <div className="map-fallback">
        <span className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center ?? defaultCenter}
      zoom={12}
      options={mapOptions(resolved)}
    >
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={{
            lat: listing.location.coordinates[1], // Latitude
            lng: listing.location.coordinates[0], // Longitude
          }}
          title={listing.title}
          icon={priceMarkerIcon(Number(listing.pricePerHour) || 0, false)}
          onClick={() => onSelect?.(listing)}
        />
      ))}
    </GoogleMap>
  );
};

export default ListingsMap;
