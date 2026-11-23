package com.backend.Parkshare.service;

import com.backend.Parkshare.model.SpecialRate;
import com.backend.Parkshare.model.UserDiscount;
import com.backend.Parkshare.pricing.ResolvedRate;
import com.backend.Parkshare.repository.SpecialRateRepository;
import com.backend.Parkshare.repository.UserDiscountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RateResolutionServiceTest {

    @Mock
    private SpecialRateRepository specialRateRepository;

    @Mock
    private UserDiscountRepository userDiscountRepository;

    @InjectMocks
    private RateResolutionService service;

    private final LocalDateTime bookingStart = LocalDateTime.of(2026, 12, 5, 19, 0);
    private final LocalDateTime bookingEnd = LocalDateTime.of(2026, 12, 5, 21, 0);

    private SpecialRate rateCovering(LocalDateTime start, LocalDateTime end, double pricePerHour, String name) {
        SpecialRate rate = new SpecialRate();
        rate.setParkingSpaceId("space-1");
        rate.setName(name);
        rate.setStartTime(start);
        rate.setEndTime(end);
        rate.setPricePerHour(pricePerHour);
        return rate;
    }

    @BeforeEach
    void noDiscountByDefault() {
        // lenient: the "no guest email" test deliberately never reaches this
        // lookup, which would otherwise trip strict-stubbing for that one case.
        lenient().when(userDiscountRepository.findByParkingSpaceIdAndGuestEmail("space-1", "guest@example.com"))
                .thenReturn(Optional.empty());
    }

    @Test
    void noOverrideIsAPassthrough() {
        when(specialRateRepository.findByParkingSpaceId("space-1")).thenReturn(List.of());

        ResolvedRate resolved = service.resolve("space-1", 8.0, "guest@example.com", bookingStart, bookingEnd);

        assertEquals(8.0, resolved.effectivePricePerHour());
        assertEquals(8.0, resolved.originalPricePerHour());
        assertNull(resolved.specialRateName());
        assertEquals(0, resolved.discountPercent());
    }

    @Test
    void specialRateAppliesWhenBookingFallsFullyInside() {
        SpecialRate rate = rateCovering(
                bookingStart.minusHours(1), bookingEnd.plusHours(2), 18.0, "Leafs home game");
        when(specialRateRepository.findByParkingSpaceId("space-1")).thenReturn(List.of(rate));

        ResolvedRate resolved = service.resolve("space-1", 8.0, "guest@example.com", bookingStart, bookingEnd);

        assertEquals(18.0, resolved.effectivePricePerHour());
        assertEquals(8.0, resolved.originalPricePerHour());
        assertEquals("Leafs home game", resolved.specialRateName());
    }

    @Test
    void specialRateIsIgnoredOnPartialOverlap() {
        // Event window ends an hour before the booking does — only a partial
        // overlap, so the base rate applies for the whole booking, not a mix.
        SpecialRate rate = rateCovering(bookingStart.minusHours(1), bookingEnd.minusHours(1), 18.0, "Leafs home game");
        when(specialRateRepository.findByParkingSpaceId("space-1")).thenReturn(List.of(rate));

        ResolvedRate resolved = service.resolve("space-1", 8.0, "guest@example.com", bookingStart, bookingEnd);

        assertEquals(8.0, resolved.effectivePricePerHour());
        assertNull(resolved.specialRateName());
    }

    @Test
    void exactBoundaryMatchCounts() {
        // Booking window exactly equal to the event window — inclusive on both ends.
        SpecialRate rate = rateCovering(bookingStart, bookingEnd, 18.0, "Leafs home game");
        when(specialRateRepository.findByParkingSpaceId("space-1")).thenReturn(List.of(rate));

        ResolvedRate resolved = service.resolve("space-1", 8.0, "guest@example.com", bookingStart, bookingEnd);

        assertEquals(18.0, resolved.effectivePricePerHour());
    }

    @Test
    void discountAloneAppliesToBaseRate() {
        when(specialRateRepository.findByParkingSpaceId("space-1")).thenReturn(List.of());
        UserDiscount discount = new UserDiscount();
        discount.setPercentOff(15.0);
        when(userDiscountRepository.findByParkingSpaceIdAndGuestEmail("space-1", "guest@example.com"))
                .thenReturn(Optional.of(discount));

        ResolvedRate resolved = service.resolve("space-1", 10.0, "guest@example.com", bookingStart, bookingEnd);

        assertEquals(8.5, resolved.effectivePricePerHour(), 0.0001);
        assertEquals(10.0, resolved.originalPricePerHour());
        assertEquals(15.0, resolved.discountPercent());
    }

    @Test
    void specialRateAndDiscountStack() {
        SpecialRate rate = rateCovering(
                bookingStart.minusHours(1), bookingEnd.plusHours(2), 20.0, "Leafs home game");
        when(specialRateRepository.findByParkingSpaceId("space-1")).thenReturn(List.of(rate));
        UserDiscount discount = new UserDiscount();
        discount.setPercentOff(10.0);
        when(userDiscountRepository.findByParkingSpaceIdAndGuestEmail("space-1", "guest@example.com"))
                .thenReturn(Optional.of(discount));

        ResolvedRate resolved = service.resolve("space-1", 8.0, "guest@example.com", bookingStart, bookingEnd);

        // $20 event rate, then 10% off: $18.
        assertEquals(18.0, resolved.effectivePricePerHour(), 0.0001);
        assertEquals(8.0, resolved.originalPricePerHour());
        assertEquals("Leafs home game", resolved.specialRateName());
        assertEquals(10.0, resolved.discountPercent());
    }

    @Test
    void noGuestEmailSkipsDiscountLookupEntirely() {
        when(specialRateRepository.findByParkingSpaceId("space-1")).thenReturn(List.of());

        ResolvedRate resolved = service.resolve("space-1", 8.0, null, bookingStart, bookingEnd);

        assertEquals(8.0, resolved.effectivePricePerHour());
        assertEquals(0, resolved.discountPercent());
    }
}
