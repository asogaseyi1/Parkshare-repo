package com.backend.Parkshare.service;

import com.backend.Parkshare.model.SpecialRate;
import com.backend.Parkshare.model.UserDiscount;
import com.backend.Parkshare.pricing.ResolvedRate;
import com.backend.Parkshare.repository.SpecialRateRepository;
import com.backend.Parkshare.repository.UserDiscountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Resolves the hourly rate a specific guest actually pays for a booking
 * window: the listing's base rate, unless a host-entered SpecialRate covers
 * the whole window (then that rate instead), then a standing UserDiscount
 * for that guest on that listing (if any) is applied on top.
 *
 * Deliberately separate from PricingService — that service's pure
 * rate/hours/fees math and its tests stay untouched; this is the one place
 * that does the Mongo lookups to decide WHICH rate PricingService should be
 * given.
 */
@Service
public class RateResolutionService {

    @Autowired
    private SpecialRateRepository specialRateRepository;

    @Autowired
    private UserDiscountRepository userDiscountRepository;

    public ResolvedRate resolve(String parkingSpaceId, double basePricePerHour, String guestEmail,
                                 LocalDateTime startTime, LocalDateTime endTime) {
        double effectiveRate = basePricePerHour;
        String specialRateName = null;

        Optional<SpecialRate> covering = findCoveringRate(parkingSpaceId, startTime, endTime);
        if (covering.isPresent()) {
            effectiveRate = covering.get().getPricePerHour();
            specialRateName = covering.get().getName();
        }

        double discountPercent = 0;
        if (guestEmail != null) {
            Optional<UserDiscount> discount =
                    userDiscountRepository.findByParkingSpaceIdAndGuestEmail(parkingSpaceId, guestEmail);
            if (discount.isPresent()) {
                discountPercent = discount.get().getPercentOff();
                effectiveRate = effectiveRate * (1 - discountPercent / 100.0);
            }
        }

        return new ResolvedRate(effectiveRate, basePricePerHour, specialRateName, discountPercent);
    }

    /**
     * A booking only gets a special rate if its whole window falls inside
     * one — a partial overlap falls back to the base rate entirely rather
     * than prorating across the boundary.
     */
    private Optional<SpecialRate> findCoveringRate(String parkingSpaceId, LocalDateTime startTime,
                                                     LocalDateTime endTime) {
        List<SpecialRate> rates = specialRateRepository.findByParkingSpaceId(parkingSpaceId);
        return rates.stream()
                .filter(rate -> !startTime.isBefore(rate.getStartTime()) && !endTime.isAfter(rate.getEndTime()))
                .findFirst();
    }
}
