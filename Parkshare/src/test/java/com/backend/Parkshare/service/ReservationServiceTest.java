package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.ReservationRequest;
import com.backend.Parkshare.exception.BadRequestException;
import com.backend.Parkshare.exception.ConflictException;
import com.backend.Parkshare.exception.NotFoundException;
import com.backend.Parkshare.model.ParkingSpace;
import com.backend.Parkshare.model.Reservation;
import com.backend.Parkshare.pricing.PriceBreakdownCents;
import com.backend.Parkshare.repository.ParkingSpaceRepository;
import com.backend.Parkshare.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Covers the guard clauses in ReservationService — all three run before the
 * Stripe call, so none of these cases need a PaymentIntent to be mocked.
 */
@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepo;

    @Mock
    private ParkingSpaceRepository parkingSpaceRepo;

    @Mock
    private PricingService pricingService;

    @InjectMocks
    private ReservationService service;

    private ReservationRequest request;

    @BeforeEach
    void setup() {
        request = new ReservationRequest();
        request.setUserEmail("driver@example.com");
        request.setParkingSpaceId("space-1");
        request.setStartTime(LocalDateTime.of(2025, 1, 1, 9, 0));
        request.setEndTime(LocalDateTime.of(2025, 1, 1, 11, 0));
        request.setPaymentMethodId("pm_test");
    }

    @Test
    void rejectsEndTimeAtOrBeforeStartTime() {
        request.setEndTime(request.getStartTime());

        assertThrows(BadRequestException.class, () -> service.createReservation(request));
        verifyNoInteractions(parkingSpaceRepo, reservationRepo);
    }

    @Test
    void rejectsUnknownParkingSpace() {
        when(parkingSpaceRepo.findById("space-1")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.createReservation(request));
    }

    @Test
    void rejectsOverlappingReservation() {
        ParkingSpace space = new ParkingSpace();
        space.setPricePerHour(5.0);
        space.setCountry("CA");

        when(parkingSpaceRepo.findById("space-1")).thenReturn(Optional.of(space));
        when(reservationRepo.findByParkingSpaceIdAndTimeRange("space-1", request.getStartTime(), request.getEndTime()))
                .thenReturn(List.of(new Reservation()));

        assertThrows(ConflictException.class, () -> service.createReservation(request));
        // Conflict is detected before pricing is ever quoted.
        verifyNoInteractions(pricingService);
    }

    @Test
    void rejectsBookingBelowMinimumChargeableAmount() {
        ParkingSpace space = new ParkingSpace();
        space.setPricePerHour(0.10);
        space.setCountry("CA");

        when(parkingSpaceRepo.findById("space-1")).thenReturn(Optional.of(space));
        when(reservationRepo.findByParkingSpaceIdAndTimeRange("space-1", request.getStartTime(), request.getEndTime()))
                .thenReturn(List.of());

        // 2 hrs * $0.10 = 20 cents base; even with fees/tax, well under the 50-cent floor.
        when(pricingService.quoteCents(anyDouble(), anyString(), any(), any())).thenReturn(
                new PriceBreakdownCents(2.0, "CAD", "CA", 0.10, 20, 14.0, 3, 5.0, 1, 24, 3.0, 1, 19));

        assertThrows(BadRequestException.class, () -> service.createReservation(request));
    }
}
