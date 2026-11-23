import { ParkingSpace } from './ParkingSpace';

/** A booked window on a listing, with the Airbnb-style breakdown frozen at booking time. */
export interface Reservation {
  id: string;
  userEmail: string;
  hostEmail: string;
  startTime: string;
  endTime: string;
  paid: boolean;
  parkingSpace: ParkingSpace;

  currency: string;
  baseAmount: number;
  guestServiceFee: number;
  tax: number;
  totalCharged: number;
  hostServiceFee: number;
  hostPayout: number;

  originalPricePerHour?: number;
  specialRateName?: string | null;
  discountPercent?: number;

  cancelled: boolean;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  refundAmount?: number;
}
