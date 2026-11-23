export interface GeoJsonPoint {
  type: string;
  coordinates: [number, number];
}

export interface ParkingSpaceRequest {
  ownerEmail: string;
  title: string;
  description?: string;
  location: GeoJsonPoint;
  /** ISO 3166-1 alpha-2 code (e.g. "CA", "US") — drives currency and tax. */
  country: string;
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
  country: string;
  pricePerHour: number;
  availableFrom: string;
  availableTo: string;
  createdAt: string;
  updatedAt: string;
}

/** Countries ParkShare's backend has a tax/currency profile for (see CountryTaxRegistry). */
export const SUPPORTED_COUNTRIES: { code: string; name: string; currency: string }[] = [
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
];

/** A listing's settlement currency from its country code; falls back to CAD. */
export const currencyForCountry = (countryCode?: string | null): string =>
  SUPPORTED_COUNTRIES.find((c) => c.code === countryCode)?.currency ?? 'CAD';

/** Current fee rates from GET /pricing/config — avoids hardcoding them in the frontend. */
export interface PricingConfig {
  guestServiceFeePercent: number;
  hostServiceFeePercent: number;
}

/** Airbnb-style itemized quote returned by GET /parking-spaces/:id/price-quote. */
export interface PriceBreakdown {
  hours: number;
  currency: string;
  countryCode: string;
  pricePerHour: number;
  /** Set only when a host event rate and/or standing discount applied — see RateResolutionService. */
  originalPricePerHour?: number;
  specialRateName?: string | null;
  discountPercent?: number;
  baseAmount: number;
  guestServiceFeeRate: number;
  guestServiceFee: number;
  taxRate: number;
  tax: number;
  totalCharged: number;
  hostServiceFeeRate: number;
  hostServiceFee: number;
  hostPayout: number;
}

/** A host-entered rate override for one listing over a specific event window. */
export interface SpecialRate {
  id: string;
  parkingSpaceId: string;
  ownerEmail: string;
  name: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  createdAt: string;
}

export interface SpecialRateRequest {
  name: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
}

/** A standing per-guest discount a host has granted on one listing. */
export interface UserDiscount {
  id: string;
  parkingSpaceId: string;
  ownerEmail: string;
  guestEmail: string;
  percentOff: number;
  createdAt: string;
}

export interface UserDiscountRequest {
  guestEmail: string;
  percentOff: number;
}