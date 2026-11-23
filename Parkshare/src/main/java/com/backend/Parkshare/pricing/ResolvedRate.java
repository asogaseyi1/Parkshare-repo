package com.backend.Parkshare.pricing;

/**
 * The hourly rate a specific guest actually pays for a specific booking
 * window, after applying any host-entered event rate and/or per-guest
 * discount — see RateResolutionService. Kept separate from PricingService's
 * own pure math so that service's signature and tests stay untouched.
 */
public record ResolvedRate(
        double effectivePricePerHour,
        double originalPricePerHour,
        String specialRateName,
        double discountPercent
) {
}
