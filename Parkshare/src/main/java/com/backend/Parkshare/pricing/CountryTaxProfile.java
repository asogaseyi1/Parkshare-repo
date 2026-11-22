package com.backend.Parkshare.pricing;

/**
 * Federal-level tax treatment and settlement currency for one country.
 * Deliberately coarse: provincial/state and local taxes (HST top-ups,
 * US state/local sales tax, etc.) are out of scope — only the
 * country-wide federal rate is modeled here.
 */
public record CountryTaxProfile(
        String countryCode,
        String countryName,
        String currency,
        double federalTaxPercent
) {
}
