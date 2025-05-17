package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.ReservationRequest;
import com.backend.Parkshare.model.Reservation;
import com.backend.Parkshare.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    @PostMapping("/create")
    public Reservation createReservation(@RequestBody ReservationRequest request) throws Exception {
        return reservationService.createReservation(request);
    }
}
