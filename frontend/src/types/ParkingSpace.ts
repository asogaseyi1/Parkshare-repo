export interface GeoJsonPoint {
  type: string;
  coordinates: [number, number];
}

export interface ParkingSpaceRequest {
  ownerEmail: string;
  title: string;
  description?: string;
  location: GeoJsonPoint;
  pricePerHour: number;
  availableFrom: string;
  availableTo: string;
}

export interface ParkingSpaceResponse extends ParkingSpaceRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
}


export interface ParkingSpace {
  id: string;
  ownerEmail: string;
  title: string;
  description?: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  pricePerHour: number;
  availableFrom: string;
  availableTo: string;
  createdAt: string;
  updatedAt: string;
}