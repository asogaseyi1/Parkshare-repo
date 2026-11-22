package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.ReservationRequest;
import com.backend.Parkshare.model.Reservation;
import com.backend.Parkshare.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    @PostMapping("/create")
    public Reservation createReservation(@Valid @RequestBody ReservationRequest request) {
        return reservationService.createReservation(request);
    }
}
