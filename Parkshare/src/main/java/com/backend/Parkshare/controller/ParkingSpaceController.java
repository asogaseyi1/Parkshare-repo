package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.ParkingSpaceRequest;
import com.backend.Parkshare.dto.ParkingSpaceResponse;
import com.backend.Parkshare.dto.PriceBreakdown;
import com.backend.Parkshare.exception.NotFoundException;
import com.backend.Parkshare.service.ParkingSpaceService;
import com.backend.Parkshare.service.PricingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/parking-spaces")

public class ParkingSpaceController {

    private final ParkingSpaceService service;
    private final PricingService pricingService;

    public ParkingSpaceController(ParkingSpaceService service, PricingService pricingService) {
        this.service = service;
        this.pricingService = pricingService;
    }


    @PostMapping
    public ResponseEntity<ParkingSpaceResponse> createParkingSpace(@Valid @RequestBody ParkingSpaceRequest request) {
        return ResponseEntity.ok(service.createParkingSpace(request));
    }

    @GetMapping
    public ResponseEntity<List<ParkingSpaceResponse>> getAllParkingSpaces() {
        return ResponseEntity.ok(service.getAllParkingSpaces());
    }

    @GetMapping("/owner/{email}")
    public ResponseEntity<List<ParkingSpaceResponse>> getByOwner(@PathVariable String email) {
        return ResponseEntity.ok(service.getParkingSpacesByOwner(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParkingSpaceResponse> getById(@PathVariable String id) {
        return service.getParkingSpaceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Airbnb-style itemized quote for a candidate booking window, shown before the guest pays. */
    @GetMapping("/{id}/price-quote")
    public ResponseEntity<PriceBreakdown> getPriceQuote(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        ParkingSpaceResponse space = service.getParkingSpaceById(id)
                .orElseThrow(() -> new NotFoundException("Parking space not found"));
        return ResponseEntity.ok(
                pricingService.quote(space.getPricePerHour(), space.getCountry(), startTime, endTime));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ParkingSpaceResponse> update(@PathVariable String id, @Valid @RequestBody ParkingSpaceRequest request) {
        return ResponseEntity.ok(service.updateParkingSpace(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.deleteParkingSpace(id);
        return ResponseEntity.noContent().build();
    }
}
