package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.ReservationRequest;
import com.backend.Parkshare.model.Reservation;
import com.backend.Parkshare.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    @PostMapping("/create")
    public Reservation createReservation(@Valid @RequestBody ReservationRequest request,
                                          Authentication authentication) {
        // The authenticated caller's email, not request.getUserEmail(), is what
        // resolves a per-guest discount — otherwise anyone could set someone
        // else's email in the body and book at their discounted rate.
        return reservationService.createReservation(request, authentication.getName());
    }

    @GetMapping("/mine")
    public List<Reservation> myReservations(Authentication authentication) {
        return reservationService.listForGuest(authentication.getName());
    }

    @GetMapping("/hosting")
    public List<Reservation> hostingReservations(Authentication authentication) {
        return reservationService.listForHost(authentication.getName());
    }

    @PostMapping("/{id}/cancel")
    public Reservation cancel(@PathVariable String id, Authentication authentication) {
        return reservationService.cancel(id, authentication.getName());
    }
}
