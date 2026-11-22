package com.backend.Parkshare.service;

import com.backend.Parkshare.exception.BadRequestException;
import com.backend.Parkshare.pricing.PriceBreakdownCents;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Verifies the actual Airbnb-style math: guest pays rate + guest fee + tax;
 * host nets rate - host fee. Fee/tax percentages are set directly (bypassing
 * Spring's @Value injection, which isn't active outside a running context)
 * so the expected numbers in this test are exact and don't drift if
 * application.properties defaults ever change.
 */
class PricingServiceTest {

    private final PricingService service = new PricingService();
    private final LocalDateTime start = LocalDateTime.of(2026, 1, 1, 9, 0);
    private final LocalDateTime end = LocalDateTime.of(2026, 1, 1, 11, 0); // 2 hours

    @BeforeEach
    void setRates() throws Exception {
        setPrivate(service, "guestServiceFeePercent", 14.0);
        setPrivate(service, "hostServiceFeePercent", 3.0);
    }

    @Test
    void canadianListingChargesGstOnTopOfGuestFee() {
        // base = $5/hr * 2hr = $10.00 -> 1000 cents
        PriceBreakdownCents quote = service.quoteCents(5.0, "CA", start, end);

        assertEquals(1000, quote.baseCents());
        assertEquals(140, quote.guestServiceFeeCents());  // 14% of 1000
        assertEquals(50, quote.taxCents());               // 5% GST of 1000
        assertEquals(1190, quote.totalChargedCents());    // guest pays 1000+140+50
        assertEquals(30, quote.hostServiceFeeCents());    // 3% of 1000
        assertEquals(970, quote.hostPayoutCents());       // host nets 1000-30
        assertEquals("CAD", quote.currency());
    }

    @Test
    void usListingHasNoFederalTax() {
        PriceBreakdownCents quote = service.quoteCents(5.0, "US", start, end);

        assertEquals(1000, quote.baseCents());
        assertEquals(0, quote.taxCents());
        assertEquals(1140, quote.totalChargedCents()); // base + guest fee only, no tax
        assertEquals("USD", quote.currency());
    }

    @Test
    void hostNeverReceivesMoreThanTheGuestWasChargedForTheBase() {
        PriceBreakdownCents quote = service.quoteCents(5.0, "CA", start, end);

        // The core guarantee this feature exists for: the host's cut is strictly
        // less than the base rate, and the guest's total is strictly more.
        assertEquals(true, quote.hostPayoutCents() < quote.baseCents());
        assertEquals(true, quote.totalChargedCents() > quote.baseCents());
    }

    @Test
    void fractionalHoursBillAccurately() {
        // 1.5 hours at $10/hr = $15.00 base, not truncated to 1 hour.
        PriceBreakdownCents quote = service.quoteCents(10.0, "US", start, start.plusMinutes(90));
        assertEquals(1500, quote.baseCents());
    }

    @Test
    void rejectsUnsupportedCountry() {
        assertThrows(BadRequestException.class, () -> service.quoteCents(5.0, "ZZ", start, end));
    }

    @Test
    void rejectsEndTimeAtOrBeforeStartTime() {
        assertThrows(BadRequestException.class, () -> service.quoteCents(5.0, "CA", end, start));
    }

    private static void setPrivate(Object target, String field, Object value) throws Exception {
        Field f = PricingService.class.getDeclaredField(field);
        f.setAccessible(true);
        f.set(target, value);
    }
}
