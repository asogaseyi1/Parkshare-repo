package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.ReservationRequest;
import com.backend.Parkshare.exception.BadRequestException;
import com.backend.Parkshare.exception.ConflictException;
import com.backend.Parkshare.exception.NotFoundException;
import com.backend.Parkshare.exception.PaymentException;
import com.backend.Parkshare.model.ParkingSpace;
import com.backend.Parkshare.model.Reservation;
import com.backend.Parkshare.pricing.PriceBreakdownCents;
import com.backend.Parkshare.repository.ParkingSpaceRepository;
import com.backend.Parkshare.repository.ReservationRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReservationService {

    // Stripe's floor for a 2-decimal-currency charge (CAD/USD/GBP/AUD — all
    // the currencies in CountryTaxRegistry).
    private static final long MIN_CHARGE_CENTS = 50;

    @Autowired
    private ReservationRepository reservationRepo;

    @Autowired
    private ParkingSpaceRepository parkingSpaceRepo;

    @Autowired
    private PricingService pricingService;

    public Reservation createReservation(ReservationRequest request) {
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time.");
        }

        ParkingSpace space = parkingSpaceRepo.findById(request.getParkingSpaceId())
                .orElseThrow(() -> new NotFoundException("Parking space not found"));

        List<Reservation> conflicts = reservationRepo.findByParkingSpaceIdAndTimeRange(
                request.getParkingSpaceId(), request.getStartTime(), request.getEndTime());

        if (!conflicts.isEmpty()) {
            throw new ConflictException("Time slot already reserved.");
        }

        // The guest is charged base + ParkShare's guest service fee + tax; the
        // host later nets base - ParkShare's smaller host service fee. See
        // PricingService for the Airbnb-style math.
        PriceBreakdownCents pricing = pricingService.quoteCents(
                space.getPricePerHour(), space.getCountry(), request.getStartTime(), request.getEndTime());

        if (pricing.totalChargedCents() < MIN_CHARGE_CENTS) {
            throw new BadRequestException("This booking's total is below the minimum chargeable amount.");
        }

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(pricing.totalChargedCents())
                .setCurrency(pricing.currency().toLowerCase())
                .setPaymentMethod(request.getPaymentMethodId())
                .setConfirm(true)
                .setConfirmationMethod(PaymentIntentCreateParams.ConfirmationMethod.AUTOMATIC)
                .build();

        PaymentIntent intent;
        try {
            intent = PaymentIntent.create(params);
        } catch (StripeException e) {
            throw new PaymentException("Payment failed: " + e.getMessage());
        }

        if (!"succeeded".equals(intent.getStatus())) {
            // e.g. requires_action (3D Secure) or requires_payment_method (declined) —
            // the old code ignored this and saved the reservation as paid regardless.
            throw new PaymentException("Payment was not completed (status: " + intent.getStatus() + ").");
        }

        Reservation reservation = new Reservation();
        reservation.setUserEmail(request.getUserEmail());
        reservation.setStartTime(request.getStartTime());
        reservation.setEndTime(request.getEndTime());
        reservation.setPaid(true);
        reservation.setParkingSpace(space);
        reservation.setCurrency(pricing.currency());
        reservation.setBaseAmount(toDollars(pricing.baseCents()));
        reservation.setGuestServiceFee(toDollars(pricing.guestServiceFeeCents()));
        reservation.setTax(toDollars(pricing.taxCents()));
        reservation.setTotalCharged(toDollars(pricing.totalChargedCents()));
        reservation.setHostServiceFee(toDollars(pricing.hostServiceFeeCents()));
        reservation.setHostPayout(toDollars(pricing.hostPayoutCents()));

        return reservationRepo.save(reservation);
    }

    private static double toDollars(long cents) {
        return cents / 100.0;
    }
}
