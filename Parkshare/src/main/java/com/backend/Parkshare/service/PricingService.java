package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.PriceBreakdown;
import com.backend.Parkshare.dto.PricingConfig;
import com.backend.Parkshare.exception.BadRequestException;
import com.backend.Parkshare.pricing.CountryTaxProfile;
import com.backend.Parkshare.pricing.CountryTaxRegistry;
import com.backend.Parkshare.pricing.PriceBreakdownCents;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Airbnb-style split: the renter pays the host's rate plus a guest service
 * fee and the listing country's federal tax; the host receives the rate
 * minus a smaller host service fee. ParkShare keeps both service fees —
 * collected tax is not platform revenue, it's owed to the relevant
 * government and just passes through this calculation.
 */
@Service
public class PricingService {

    @Value("${pricing.guest-service-fee-percent:14.0}")
    private double guestServiceFeePercent;

    @Value("${pricing.host-service-fee-percent:3.0}")
    private double hostServiceFeePercent;

    /** Precise, integer-cents quote — what actually gets charged and persisted. */
    public PriceBreakdownCents quoteCents(double pricePerHour, String countryCode,
                                           LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null || !endTime.isAfter(startTime)) {
            throw new BadRequestException("End time must be after start time.");
        }

        CountryTaxProfile taxProfile = CountryTaxRegistry.find(countryCode)
                .orElseThrow(() -> new BadRequestException(
                        "This listing's country ('" + countryCode + "') isn't configured for pricing."));

        // Fractional hours, so a 90-minute booking bills 1.5x rather than truncating to 1x.
        double hours = Duration.between(startTime, endTime).toMinutes() / 60.0;

        long baseCents = Math.round(pricePerHour * hours * 100);
        long guestFeeCents = percentOf(baseCents, guestServiceFeePercent);
        long taxCents = percentOf(baseCents, taxProfile.federalTaxPercent());
        long totalCents = baseCents + guestFeeCents + taxCents;
        long hostFeeCents = percentOf(baseCents, hostServiceFeePercent);
        long hostPayoutCents = baseCents - hostFeeCents;

        return new PriceBreakdownCents(
                hours, taxProfile.currency(), taxProfile.countryCode(), pricePerHour,
                baseCents, guestServiceFeePercent, guestFeeCents,
                taxProfile.federalTaxPercent(), taxCents, totalCents,
                hostServiceFeePercent, hostFeeCents, hostPayoutCents);
    }

    /** Current fee rates — lets the frontend show accurate host-payout estimates without hardcoding them. */
    public PricingConfig getConfig() {
        return new PricingConfig(guestServiceFeePercent, hostServiceFeePercent);
    }

    /** Dollar-based quote for API responses. */
    public PriceBreakdown quote(double pricePerHour, String countryCode,
                                 LocalDateTime startTime, LocalDateTime endTime) {
        return toDto(quoteCents(pricePerHour, countryCode, startTime, endTime));
    }

    public static PriceBreakdown toDto(PriceBreakdownCents cents) {
        PriceBreakdown dto = new PriceBreakdown();
        dto.setHours(cents.hours());
        dto.setCurrency(cents.currency());
        dto.setCountryCode(cents.countryCode());
        dto.setPricePerHour(cents.pricePerHour());
        dto.setBaseAmount(toDollars(cents.baseCents()));
        dto.setGuestServiceFeeRate(cents.guestServiceFeeRate());
        dto.setGuestServiceFee(toDollars(cents.guestServiceFeeCents()));
        dto.setTaxRate(cents.taxRate());
        dto.setTax(toDollars(cents.taxCents()));
        dto.setTotalCharged(toDollars(cents.totalChargedCents()));
        dto.setHostServiceFeeRate(cents.hostServiceFeeRate());
        dto.setHostServiceFee(toDollars(cents.hostServiceFeeCents()));
        dto.setHostPayout(toDollars(cents.hostPayoutCents()));
        return dto;
    }

    private static long percentOf(long baseCents, double percent) {
        return Math.round(baseCents * percent / 100.0);
    }

    private static double toDollars(long cents) {
        return cents / 100.0;
    }
}
