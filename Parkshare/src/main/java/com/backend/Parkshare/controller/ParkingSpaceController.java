package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.ParkingSpaceRequest;
import com.backend.Parkshare.dto.ParkingSpaceResponse;
import com.backend.Parkshare.dto.PriceBreakdown;
import com.backend.Parkshare.exception.NotFoundException;
import com.backend.Parkshare.pricing.ResolvedRate;
import com.backend.Parkshare.service.ParkingSpaceService;
import com.backend.Parkshare.service.PricingService;
import com.backend.Parkshare.service.RateResolutionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/parking-spaces")

public class ParkingSpaceController {

    private final ParkingSpaceService service;
    private final PricingService pricingService;
    private final RateResolutionService rateResolutionService;

    public ParkingSpaceController(ParkingSpaceService service, PricingService pricingService,
                                   RateResolutionService rateResolutionService) {
        this.service = service;
        this.pricingService = pricingService;
        this.rateResolutionService = rateResolutionService;
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
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            Authentication authentication) {
        ParkingSpaceResponse space = service.getParkingSpaceById(id)
                .orElseThrow(() -> new NotFoundException("Parking space not found"));

        // The caller's own identity, not a query param — so a guest can only ever
        // see their own discount reflected in a quote, never probe another email's.
        ResolvedRate resolved = rateResolutionService.resolve(
                id, space.getPricePerHour(), authentication.getName(), startTime, endTime);

        PriceBreakdown breakdown =
                pricingService.quote(resolved.effectivePricePerHour(), space.getCountry(), startTime, endTime);
        breakdown.setOriginalPricePerHour(resolved.originalPricePerHour());
        breakdown.setSpecialRateName(resolved.specialRateName());
        breakdown.setDiscountPercent(resolved.discountPercent());
        return ResponseEntity.ok(breakdown);
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
