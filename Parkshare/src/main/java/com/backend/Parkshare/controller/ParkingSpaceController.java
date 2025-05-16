package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.ParkingSpaceRequest;
import com.backend.Parkshare.dto.ParkingSpaceResponse;
import com.backend.Parkshare.service.ParkingSpaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parking-spaces")

public class ParkingSpaceController {

    private final ParkingSpaceService service;

    public ParkingSpaceController(ParkingSpaceService service) {
        this.service = service;
    }


    @PostMapping
    public ResponseEntity<ParkingSpaceResponse> createParkingSpace(@RequestBody ParkingSpaceRequest request) {
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

    @PutMapping("/{id}")
    public ResponseEntity<ParkingSpaceResponse> update(@PathVariable String id, @RequestBody ParkingSpaceRequest request) {
        return ResponseEntity.ok(service.updateParkingSpace(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.deleteParkingSpace(id);
        return ResponseEntity.noContent().build();
    }
}
