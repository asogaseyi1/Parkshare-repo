package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.UserDiscountRequest;
import com.backend.Parkshare.model.UserDiscount;
import com.backend.Parkshare.service.DiscountService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parking-spaces/{parkingSpaceId}/discounts")
public class DiscountController {

    private final DiscountService service;

    public DiscountController(DiscountService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<UserDiscount> create(@PathVariable String parkingSpaceId,
                                                @Valid @RequestBody UserDiscountRequest request,
                                                Authentication authentication) {
        return ResponseEntity.ok(service.create(parkingSpaceId, authentication.getName(), request));
    }

    /** Owner-only — the list of who got a discount is private to the host. */
    @GetMapping
    public ResponseEntity<List<UserDiscount>> list(@PathVariable String parkingSpaceId,
                                                     Authentication authentication) {
        return ResponseEntity.ok(service.list(parkingSpaceId, authentication.getName()));
    }

    @DeleteMapping("/{discountId}")
    public ResponseEntity<Void> delete(@PathVariable String parkingSpaceId, @PathVariable String discountId,
                                        Authentication authentication) {
        service.delete(parkingSpaceId, discountId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
