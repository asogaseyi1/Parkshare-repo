package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.ReservationRequest;
import com.backend.Parkshare.exception.BadRequestException;
import com.backend.Parkshare.exception.ConflictException;
import com.backend.Parkshare.exception.ForbiddenException;
import com.backend.Parkshare.exception.NotFoundException;
import com.backend.Parkshare.exception.PaymentException;
import com.backend.Parkshare.model.ParkingSpace;
import com.backend.Parkshare.model.Reservation;
import com.backend.Parkshare.model.ReservationLock;
import com.backend.Parkshare.pricing.PriceBreakdownCents;
import com.backend.Parkshare.pricing.ResolvedRate;
import com.backend.Parkshare.repository.ParkingSpaceRepository;
import com.backend.Parkshare.repository.ReservationLockRepository;
import com.backend.Parkshare.repository.ReservationRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.Refund;
import com.stripe.param.RefundCreateParams;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Covers the guard clauses in ReservationService, plus the per-space booking
 * lock (ReservationLock) that closes the double-booking race: two concurrent
 * requests for an overlapping window must not both pass the conflict check
 * before either has saved. None of these cases reach the Stripe call, which
 * is a static method call this test suite doesn't mock.
 */
@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    private static final String AUTHENTICATED_EMAIL = "driver@example.com";

    @Mock
    private ReservationRepository reservationRepo;

    @Mock
    private ParkingSpaceRepository parkingSpaceRepo;

    @Mock
    private ReservationLockRepository lockRepo;

    @Mock
    private PricingService pricingService;

    @Mock
    private RateResolutionService rateResolutionService;

    @InjectMocks
    private ReservationService service;

    private ReservationRequest request;

    @BeforeEach
    void setup() {
        request = new ReservationRequest();
        request.setUserEmail(AUTHENTICATED_EMAIL);
        request.setParkingSpaceId("space-1");
        request.setStartTime(LocalDateTime.of(2025, 1, 1, 9, 0));
        request.setEndTime(LocalDateTime.of(2025, 1, 1, 11, 0));
        request.setPaymentMethodId("pm_test");
    }

    /** Pass-through resolution: no event rate or discount applies. */
    private static ResolvedRate passThrough(double pricePerHour) {
        return new ResolvedRate(pricePerHour, pricePerHour, null, 0);
    }

    @Test
    void rejectsEndTimeAtOrBeforeStartTime() {
        request.setEndTime(request.getStartTime());

        assertThrows(BadRequestException.class,
                () -> service.createReservation(request, AUTHENTICATED_EMAIL));
        verifyNoInteractions(parkingSpaceRepo, reservationRepo, lockRepo, rateResolutionService);
    }

    @Test
    void rejectsUnknownParkingSpace() {
        when(parkingSpaceRepo.findById("space-1")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> service.createReservation(request, AUTHENTICATED_EMAIL));
        verifyNoInteractions(lockRepo, rateResolutionService);
    }

    @Test
    void rejectsOverlappingReservation() {
        ParkingSpace space = new ParkingSpace();
        space.setId("space-1");
        space.setPricePerHour(5.0);
        space.setCountry("CA");

        when(parkingSpaceRepo.findById("space-1")).thenReturn(Optional.of(space));
        when(rateResolutionService.resolve(anyString(), anyDouble(), any(), any(), any()))
                .thenReturn(passThrough(5.0));
        when(pricingService.quoteCents(anyDouble(), anyString(), any(), any())).thenReturn(
                new PriceBreakdownCents(2.0, "CAD", "CA", 5.0, 1000, 14.0, 140, 5.0, 50, 1190, 3.0, 30, 970));
        when(reservationRepo.findByParkingSpaceIdAndTimeRange("space-1", request.getStartTime(), request.getEndTime()))
                .thenReturn(List.of(new Reservation()));

        assertThrows(ConflictException.class,
                () -> service.createReservation(request, AUTHENTICATED_EMAIL));
        // The lock must be released even though the booking itself was rejected —
        // otherwise every failed attempt would permanently jam that space.
        verify(lockRepo).deleteById("space-1");
    }

    @Test
    void rejectsBookingBelowMinimumChargeableAmount() {
        ParkingSpace space = new ParkingSpace();
        space.setId("space-1");
        space.setPricePerHour(0.10);
        space.setCountry("CA");

        when(parkingSpaceRepo.findById("space-1")).thenReturn(Optional.of(space));
        when(rateResolutionService.resolve(anyString(), anyDouble(), any(), any(), any()))
                .thenReturn(passThrough(0.10));

        // 2 hrs * $0.10 = 20 cents base; even with fees/tax, well under the 50-cent floor.
        when(pricingService.quoteCents(anyDouble(), anyString(), any(), any())).thenReturn(
                new PriceBreakdownCents(2.0, "CAD", "CA", 0.10, 20, 14.0, 3, 5.0, 1, 24, 3.0, 1, 19));

        assertThrows(BadRequestException.class,
                () -> service.createReservation(request, AUTHENTICATED_EMAIL));
        // Rejected on price alone, before the lock/conflict-check is ever reached.
        verifyNoInteractions(lockRepo, reservationRepo);
    }

    @Test
    void givesUpAfterRepeatedLockContentionOnTheSameSpace() {
        ParkingSpace space = new ParkingSpace();
        space.setId("space-1");
        space.setPricePerHour(5.0);
        space.setCountry("CA");

        when(parkingSpaceRepo.findById("space-1")).thenReturn(Optional.of(space));
        when(rateResolutionService.resolve(anyString(), anyDouble(), any(), any(), any()))
                .thenReturn(passThrough(5.0));
        when(pricingService.quoteCents(anyDouble(), anyString(), any(), any())).thenReturn(
                new PriceBreakdownCents(2.0, "CAD", "CA", 5.0, 1000, 14.0, 140, 5.0, 50, 1190, 3.0, 30, 970));
        // Simulates another request holding the lock for this space the entire time.
        when(lockRepo.insert(any(ReservationLock.class))).thenThrow(new DuplicateKeyException("locked"));

        assertThrows(ConflictException.class,
                () -> service.createReservation(request, AUTHENTICATED_EMAIL));
        verify(lockRepo, times(5)).insert(any(ReservationLock.class));
        // Never acquired, so there's nothing to release and no conflict check ran.
        verifyNoInteractions(reservationRepo);
    }

    @Test
    void discountAppliesForAuthenticatedCallerNotRequestBodyEmail() {
        // request.getUserEmail() is attacker-controlled; the discount lookup
        // must use the authenticated caller's email instead, or anyone could
        // set someone else's email in the body to steal their discount.
        ParkingSpace space = new ParkingSpace();
        space.setId("space-1");
        space.setPricePerHour(10.0);
        space.setCountry("CA");
        request.setUserEmail("victim@example.com"); // attacker-supplied, should be ignored for pricing

        when(parkingSpaceRepo.findById("space-1")).thenReturn(Optional.of(space));
        when(rateResolutionService.resolve("space-1", 10.0, AUTHENTICATED_EMAIL,
                request.getStartTime(), request.getEndTime())).thenReturn(
                new ResolvedRate(8.5, 10.0, null, 15.0));
        when(pricingService.quoteCents(anyDouble(), anyString(), any(), any())).thenReturn(
                new PriceBreakdownCents(2.0, "CAD", "CA", 8.5, 1700, 14.0, 238, 5.0, 85, 2023, 3.0, 51, 1649));
        when(reservationRepo.findByParkingSpaceIdAndTimeRange("space-1", request.getStartTime(), request.getEndTime()))
                .thenReturn(List.of());

        // Below the min-charge floor is not the point here — this fails later at
        // Stripe (unmocked), so just prove resolve() was called with the caller's
        // own email, not the attacker-supplied request body email.
        assertThrows(RuntimeException.class, () -> service.createReservation(request, AUTHENTICATED_EMAIL));
        verify(rateResolutionService).resolve("space-1", 10.0, AUTHENTICATED_EMAIL,
                request.getStartTime(), request.getEndTime());
    }

    /* --------------------------------------------------------------- cancel -- */

    private static Reservation futureReservation() {
        Reservation reservation = new Reservation();
        reservation.setId("res-1");
        reservation.setUserEmail("driver@example.com");
        reservation.setHostEmail("host@example.com");
        reservation.setStartTime(LocalDateTime.now().plusDays(1));
        reservation.setEndTime(LocalDateTime.now().plusDays(1).plusHours(2));
        reservation.setStripePaymentIntentId("pi_test_123");
        reservation.setTotalCharged(19.90);
        return reservation;
    }

    @Test
    void cancel_rejectsUnknownReservation() {
        when(reservationRepo.findById("missing")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.cancel("missing", "driver@example.com"));
    }

    @Test
    void cancel_rejectsCallerWhoIsNeitherGuestNorHost() {
        when(reservationRepo.findById("res-1")).thenReturn(Optional.of(futureReservation()));

        assertThrows(ForbiddenException.class, () -> service.cancel("res-1", "stranger@example.com"));
    }

    @Test
    void cancel_allowsTheHostAsWellAsTheGuest() {
        Reservation reservation = futureReservation();
        when(reservationRepo.findById("res-1")).thenReturn(Optional.of(reservation));

        try (MockedStatic<Refund> refundStatic = mockStatic(Refund.class)) {
            Refund refund = new Refund();
            refund.setId("re_test_1");
            refundStatic.when(() -> Refund.create(any(RefundCreateParams.class))).thenReturn(refund);
            when(reservationRepo.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

            Reservation result = service.cancel("res-1", "host@example.com");

            assertTrue(result.isCancelled());
            assertEquals("host@example.com", result.getCancelledBy());
        }
    }

    @Test
    void cancel_rejectsAlreadyCancelledReservation() {
        Reservation reservation = futureReservation();
        reservation.setCancelled(true);
        when(reservationRepo.findById("res-1")).thenReturn(Optional.of(reservation));

        assertThrows(ConflictException.class, () -> service.cancel("res-1", "driver@example.com"));
    }

    @Test
    void cancel_rejectsOnceTheReservationHasStarted() {
        Reservation reservation = futureReservation();
        reservation.setStartTime(LocalDateTime.now().minusMinutes(5));
        when(reservationRepo.findById("res-1")).thenReturn(Optional.of(reservation));

        assertThrows(BadRequestException.class, () -> service.cancel("res-1", "driver@example.com"));
    }

    @Test
    void cancel_issuesAFullRefundAndMarksTheReservationCancelled() {
        Reservation reservation = futureReservation();
        when(reservationRepo.findById("res-1")).thenReturn(Optional.of(reservation));
        when(reservationRepo.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        try (MockedStatic<Refund> refundStatic = mockStatic(Refund.class)) {
            Refund refund = new Refund();
            refund.setId("re_test_2");
            refundStatic.when(() -> Refund.create(any(RefundCreateParams.class))).thenReturn(refund);

            Reservation result = service.cancel("res-1", "driver@example.com");

            assertTrue(result.isCancelled());
            assertEquals("re_test_2", result.getStripeRefundId());
            assertEquals(19.90, result.getRefundAmount());
            assertEquals("driver@example.com", result.getCancelledBy());

            refundStatic.verify(() -> Refund.create(argThat((RefundCreateParams params) ->
                    "pi_test_123".equals(params.getPaymentIntent()))));
        }
    }

    @Test
    void cancel_leavesReservationUncancelledWhenStripeRefundFails() {
        Reservation reservation = futureReservation();
        when(reservationRepo.findById("res-1")).thenReturn(Optional.of(reservation));

        try (MockedStatic<Refund> refundStatic = mockStatic(Refund.class)) {
            refundStatic.when(() -> Refund.create(any(RefundCreateParams.class)))
                    .thenThrow(org.mockito.Mockito.mock(StripeException.class));

            assertThrows(PaymentException.class, () -> service.cancel("res-1", "driver@example.com"));
        }

        assertFalse(reservation.isCancelled());
        verify(reservationRepo, never()).save(any(Reservation.class));
    }
}
