package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.ParkingSpaceRequest;
import com.backend.Parkshare.dto.ParkingSpaceResponse;
import com.backend.Parkshare.model.ParkingSpace;
import com.backend.Parkshare.repository.ParkingSpaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ParkingSpaceService {

    private final ParkingSpaceRepository repository;

    public ParkingSpaceService(ParkingSpaceRepository repository) {
        this.repository = repository;
    }

    public ParkingSpaceResponse createParkingSpace(ParkingSpaceRequest request) {
        ParkingSpace space = new ParkingSpace();
        space.setOwnerEmail(request.getOwnerEmail());
        space.setTitle(request.getTitle());
        space.setDescription(request.getDescription());
        space.setLocation(request.getLocation());
        space.setPricePerHour(request.getPricePerHour());
        space.setAvailableFrom(request.getAvailableFrom());
        space.setAvailableTo(request.getAvailableTo());
        space.setCreatedAt(LocalDateTime.now());
        space.setUpdatedAt(LocalDateTime.now());

        return toResponse(repository.save(space));
    }

    public List<ParkingSpaceResponse> getAllParkingSpaces() {
        return repository.findAll().stream()
                .map(ParkingSpaceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ParkingSpaceResponse> getParkingSpacesByOwner(String ownerEmail) {
        return repository.findByOwnerEmail(ownerEmail)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Optional<ParkingSpaceResponse> getParkingSpaceById(String id) {
        return repository.findById(id)
                .map(ParkingSpaceResponse::fromEntity); // This ensures `id` is not null
    }


    public ParkingSpaceResponse updateParkingSpace(String id, ParkingSpaceRequest request) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setTitle(request.getTitle());
                    existing.setDescription(request.getDescription());
                    existing.setLocation(request.getLocation());
                    existing.setPricePerHour(request.getPricePerHour());
                    existing.setAvailableFrom(request.getAvailableFrom());
                    existing.setAvailableTo(request.getAvailableTo());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return toResponse(repository.save(existing));
                })
                .orElseThrow(() -> new RuntimeException("Parking space not found"));
    }

    public void deleteParkingSpace(String id) {
        repository.deleteById(id);
    }

    private ParkingSpaceResponse toResponse(ParkingSpace space) {
        GeoJsonPoint loc = space.getLocation();

        ParkingSpaceResponse response = new ParkingSpaceResponse();
        response.setId(space.getId());
        response.setOwnerEmail(space.getOwnerEmail());
        response.setTitle(space.getTitle());
        response.setDescription(space.getDescription());
        response.setLocation(loc);
        response.setPricePerHour(space.getPricePerHour());
        response.setAvailableFrom(space.getAvailableFrom());
        response.setAvailableTo(space.getAvailableTo());
        response.setCreatedAt(space.getCreatedAt());
        response.setUpdatedAt(space.getUpdatedAt());

        return response;
    }

}
