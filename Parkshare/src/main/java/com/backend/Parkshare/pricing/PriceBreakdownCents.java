package com.backend.Parkshare.pricing;

/**
 * The precise, integer-cents form of a price quote — what ReservationService
 * actually charges and persists. PricingService.quote() converts this to the
 * dollar-based PriceBreakdown DTO for API responses; nothing re-derives cents
 * from dollars, so there's no floating-point round-trip to drift.
 */
public record PriceBreakdownCents(
        double hours,
        String currency,
        String countryCode,
        double pricePerHour,
        long baseCents,
        double guestServiceFeeRate,
        long guestServiceFeeCents,
        double taxRate,
        long taxCents,
        long totalChargedCents,
        double hostServiceFeeRate,
        long hostServiceFeeCents,
        long hostPayoutCents
) {
}
