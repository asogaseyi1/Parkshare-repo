package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.ReservationRequest;
import com.backend.Parkshare.exception.BadRequestException;
import com.backend.Parkshare.exception.ConflictException;
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
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReservationService {

    // Stripe's floor for a 2-decimal-currency charge (CAD/USD/GBP/AUD — all
    // the currencies in CountryTaxRegistry).
    private static final long MIN_CHARGE_CENTS = 50;

    // A held lock is only ever alive for a conflict-check + one insert — a few
    // milliseconds — so a handful of short retries resolves any real collision
    // without the caller seeing an error for what is normally a sub-10ms race.
    private static final int LOCK_RETRY_ATTEMPTS = 5;
    private static final long LOCK_RETRY_DELAY_MS = 100;

    @Autowired
    private ReservationRepository reservationRepo;

    @Autowired
    private ParkingSpaceRepository parkingSpaceRepo;

    @Autowired
    private ReservationLockRepository lockRepo;

    @Autowired
    private PricingService pricingService;

    @Autowired
    private RateResolutionService rateResolutionService;

    /**
     * @param authenticatedEmail the caller's own identity (from the JWT), used
     *                           ONLY to resolve a per-guest discount. request's
     *                           own userEmail still drives who the reservation
     *                           is recorded under, same as before — otherwise
     *                           anyone could set a different user's email in
     *                           the request body and book at THEIR discounted
     *                           rate.
     */
    public Reservation createReservation(ReservationRequest request, String authenticatedEmail) {
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time.");
        }

        ParkingSpace space = parkingSpaceRepo.findById(request.getParkingSpaceId())
                .orElseThrow(() -> new NotFoundException("Parking space not found"));

        // Resolves a host-entered event rate and/or the caller's standing
        // discount for this listing before pricing is computed at all.
        ResolvedRate resolved = rateResolutionService.resolve(space.getId(), space.getPricePerHour(),
                authenticatedEmail, request.getStartTime(), request.getEndTime());

        // The guest is charged base + ParkShare's guest service fee + tax; the
        // host later nets base - ParkShare's smaller host service fee. See
        // PricingService for the Airbnb-style math.
        PriceBreakdownCents pricing = pricingService.quoteCents(
                resolved.effectivePricePerHour(), space.getCountry(), request.getStartTime(), request.getEndTime());

        if (pricing.totalChargedCents() < MIN_CHARGE_CENTS) {
            throw new BadRequestException("This booking's total is below the minimum chargeable amount.");
        }

        // Provisionally claims the slot (paid=false) under a short-lived per-space
        // lock, so the conflict check and the insert happen as one atomic step.
        // Without this, two concurrent requests for an overlapping window could
        // both pass the conflict check before either had saved, double-booking
        // the space. See ReservationLock.
        Reservation reservation = claimSlot(request, space, pricing, resolved);

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
            reservationRepo.deleteById(reservation.getId()); // release the held slot
            throw new PaymentException("Payment failed: " + e.getMessage());
        }

        if (!"succeeded".equals(intent.getStatus())) {
            // e.g. requires_action (3D Secure) or requires_payment_method (declined) —
            // the old code ignored this and saved the reservation as paid regardless.
            reservationRepo.deleteById(reservation.getId()); // release the held slot
            throw new PaymentException("Payment was not completed (status: " + intent.getStatus() + ").");
        }

        reservation.setPaid(true);
        return reservationRepo.save(reservation);
    }

    /**
     * Atomically checks for conflicts and inserts a provisional (unpaid) hold,
     * under a lock scoped to just this — not the slower Stripe call that
     * follows, so contention on a popular space stays brief.
     *
     * Note: if the app crashes between here and the payment resolving above,
     * the unpaid hold is never cleaned up (no lock is held across that gap to
     * expire). A scheduled sweep for stale paid=false reservations would close
     * that gap — not built yet, flagging it as a known follow-up.
     */
    private Reservation claimSlot(ReservationRequest request, ParkingSpace space, PriceBreakdownCents pricing,
                                   ResolvedRate resolved) {
        acquireLock(request.getParkingSpaceId());
        try {
            List<Reservation> conflicts = reservationRepo.findByParkingSpaceIdAndTimeRange(
                    request.getParkingSpaceId(), request.getStartTime(), request.getEndTime());

            if (!conflicts.isEmpty()) {
                throw new ConflictException("Time slot already reserved.");
            }

            Reservation reservation = new Reservation();
            reservation.setUserEmail(request.getUserEmail());
            reservation.setStartTime(request.getStartTime());
            reservation.setEndTime(request.getEndTime());
            reservation.setPaid(false);
            reservation.setParkingSpace(space);
            reservation.setCurrency(pricing.currency());
            reservation.setBaseAmount(toDollars(pricing.baseCents()));
            reservation.setGuestServiceFee(toDollars(pricing.guestServiceFeeCents()));
            reservation.setTax(toDollars(pricing.taxCents()));
            reservation.setTotalCharged(toDollars(pricing.totalChargedCents()));
            reservation.setHostServiceFee(toDollars(pricing.hostServiceFeeCents()));
            reservation.setHostPayout(toDollars(pricing.hostPayoutCents()));
            reservation.setOriginalPricePerHour(resolved.originalPricePerHour());
            reservation.setSpecialRateName(resolved.specialRateName());
            reservation.setDiscountPercent(resolved.discountPercent());

            return reservationRepo.save(reservation);
        } finally {
            releaseLock(request.getParkingSpaceId());
        }
    }

    private void acquireLock(String parkingSpaceId) {
        for (int attempt = 1; attempt <= LOCK_RETRY_ATTEMPTS; attempt++) {
            try {
                lockRepo.insert(new ReservationLock(parkingSpaceId));
                return;
            } catch (DuplicateKeyException e) {
                if (attempt == LOCK_RETRY_ATTEMPTS) {
                    throw new ConflictException(
                            "This space is being booked by someone else right now. Please try again in a moment.");
                }
                sleep(LOCK_RETRY_DELAY_MS);
            }
        }
    }

    private void releaseLock(String parkingSpaceId) {
        lockRepo.deleteById(parkingSpaceId);
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static double toDollars(long cents) {
        return cents / 100.0;
    }
}
