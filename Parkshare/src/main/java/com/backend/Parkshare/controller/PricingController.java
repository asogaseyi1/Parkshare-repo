package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.PricingConfig;
import com.backend.Parkshare.service.PricingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pricing")
public class PricingController {

    private final PricingService pricingService;

    public PricingController(PricingService pricingService) {
        this.pricingService = pricingService;
    }

    /** Current guest/host service fee rates, so the frontend never hardcodes a figure that could drift. */
    @GetMapping("/config")
    public ResponseEntity<PricingConfig> getConfig() {
        return ResponseEntity.ok(pricingService.getConfig());
    }
}
