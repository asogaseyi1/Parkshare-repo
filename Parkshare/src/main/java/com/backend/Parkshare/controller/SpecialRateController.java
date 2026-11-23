package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.SpecialRateRequest;
import com.backend.Parkshare.model.SpecialRate;
import com.backend.Parkshare.service.SpecialRateService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parking-spaces/{parkingSpaceId}/special-rates")
public class SpecialRateController {

    private final SpecialRateService service;

    public SpecialRateController(SpecialRateService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<SpecialRate> create(@PathVariable String parkingSpaceId,
                                               @Valid @RequestBody SpecialRateRequest request,
                                               Authentication authentication) {
        return ResponseEntity.ok(service.create(parkingSpaceId, authentication.getName(), request));
    }

    /** Any authenticated user — lets guests see upcoming event pricing before booking. */
    @GetMapping
    public ResponseEntity<List<SpecialRate>> list(@PathVariable String parkingSpaceId) {
        return ResponseEntity.ok(service.listUpcoming(parkingSpaceId));
    }

    @DeleteMapping("/{rateId}")
    public ResponseEntity<Void> delete(@PathVariable String parkingSpaceId, @PathVariable String rateId,
                                        Authentication authentication) {
        service.delete(parkingSpaceId, rateId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
