package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.ReservationRequest;
import com.backend.Parkshare.model.ParkingSpace;
import com.backend.Parkshare.model.Reservation;
import com.backend.Parkshare.repository.ParkingSpaceRepository;
import com.backend.Parkshare.repository.ReservationRepository;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepo;

    @Autowired
    private ParkingSpaceRepository parkingSpaceRepo;

    public Reservation createReservation(ReservationRequest request) throws Exception {
        ParkingSpace space = parkingSpaceRepo.findById(request.getParkingSpaceId())
                .orElseThrow(() -> new Exception("Parking space not found"));

        List<Reservation> conflicts = reservationRepo.findByParkingSpaceIdAndTimeRange(
                request.getParkingSpaceId(), request.getStartTime(), request.getEndTime());

        if (!conflicts.isEmpty()) {
            throw new Exception("Time slot already reserved.");
        }

        long hours = Duration.between(request.getStartTime(), request.getEndTime()).toHours();
        long amountInCents = (long) (space.getPricePerHour() * hours * 100);

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency("usd")
                .setPaymentMethod(request.getPaymentMethodId())
                .setConfirm(true)
                .setConfirmationMethod(PaymentIntentCreateParams.ConfirmationMethod.AUTOMATIC)
                .build();

        PaymentIntent intent = PaymentIntent.create(params);

        Reservation reservation = new Reservation();
        reservation.setUserEmail(request.getUserEmail());
        reservation.setStartTime(request.getStartTime());
        reservation.setEndTime(request.getEndTime());
        reservation.setPaid(true); // You may want to verify intent.getStatus()
        reservation.setParkingSpace(space);

        return reservationRepo.save(reservation);
    }
}
