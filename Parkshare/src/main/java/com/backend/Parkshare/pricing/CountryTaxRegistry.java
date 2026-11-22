package com.backend.Parkshare.pricing;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Supported listing countries, their settlement currency, and federal tax
 * rate. A country not in this table can't be selected when creating a
 * listing (see ParkingSpaceService) — add an entry here to support one.
 */
public final class CountryTaxRegistry {

    private static final Map<String, CountryTaxProfile> PROFILES = new LinkedHashMap<>();

    static {
        register("CA", "Canada", "CAD", 5.0);          // Federal GST
        register("US", "United States", "USD", 0.0);   // Sales tax is state/local, not federal
        register("GB", "United Kingdom", "GBP", 20.0);  // VAT, charged federally (HMRC)
        register("AU", "Australia", "AUD", 10.0);       // GST
    }

    private static void register(String code, String name, String currency, double federalTaxPercent) {
        PROFILES.put(code, new CountryTaxProfile(code, name, currency, federalTaxPercent));
    }

    public static Optional<CountryTaxProfile> find(String countryCode) {
        if (countryCode == null) return Optional.empty();
        return Optional.ofNullable(PROFILES.get(countryCode.toUpperCase()));
    }

    public static Map<String, CountryTaxProfile> all() {
        return Collections.unmodifiableMap(PROFILES);
    }

    private CountryTaxRegistry() {
    }
}
