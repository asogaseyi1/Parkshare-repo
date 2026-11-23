package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.SpecialRateRequest;
import com.backend.Parkshare.exception.BadRequestException;
import com.backend.Parkshare.exception.ConflictException;
import com.backend.Parkshare.exception.NotFoundException;
import com.backend.Parkshare.model.ParkingSpace;
import com.backend.Parkshare.model.SpecialRate;
import com.backend.Parkshare.repository.SpecialRateRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SpecialRateService {

    private final SpecialRateRepository repository;
    private final ParkingSpaceService parkingSpaceService;

    public SpecialRateService(SpecialRateRepository repository, ParkingSpaceService parkingSpaceService) {
        this.repository = repository;
        this.parkingSpaceService = parkingSpaceService;
    }

    public SpecialRate create(String parkingSpaceId, String callerEmail, SpecialRateRequest request) {
        ParkingSpace space = parkingSpaceService.requireOwnership(parkingSpaceId, callerEmail);

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time.");
        }

        boolean overlaps = repository.findByParkingSpaceId(parkingSpaceId).stream()
                .anyMatch(existing -> existing.getStartTime().isBefore(request.getEndTime())
                        && existing.getEndTime().isAfter(request.getStartTime()));
        if (overlaps) {
            throw new ConflictException("This window overlaps an existing event rate for this listing.");
        }

        SpecialRate rate = new SpecialRate();
        rate.setParkingSpaceId(parkingSpaceId);
        rate.setOwnerEmail(space.getOwnerEmail());
        rate.setName(request.getName());
        rate.setStartTime(request.getStartTime());
        rate.setEndTime(request.getEndTime());
        rate.setPricePerHour(request.getPricePerHour());
        rate.setCreatedAt(LocalDateTime.now());

        return repository.save(rate);
    }

    /** Open to any authenticated user — guests should be able to see upcoming event pricing before booking. */
    public List<SpecialRate> listUpcoming(String parkingSpaceId) {
        parkingSpaceService.requireExists(parkingSpaceId);
        LocalDateTime now = LocalDateTime.now();
        return repository.findByParkingSpaceId(parkingSpaceId).stream()
                .filter(rate -> rate.getEndTime().isAfter(now))
                .collect(Collectors.toList());
    }

    public void delete(String parkingSpaceId, String rateId, String callerEmail) {
        parkingSpaceService.requireOwnership(parkingSpaceId, callerEmail);

        SpecialRate rate = repository.findById(rateId)
                .orElseThrow(() -> new NotFoundException("Event rate not found"));
        if (!rate.getParkingSpaceId().equals(parkingSpaceId)) {
            throw new NotFoundException("Event rate not found");
        }

        repository.deleteById(rateId);
    }
}
