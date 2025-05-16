package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.ParkingSpaceRequest;
import com.backend.Parkshare.dto.ParkingSpaceResponse;
import com.backend.Parkshare.model.ParkingSpace;
import com.backend.Parkshare.repository.ParkingSpaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(org.mockito.junit.jupiter.MockitoExtension.class)
class ParkingSpaceServiceTest {

    @Mock
    private ParkingSpaceRepository repository;

    @InjectMocks
    private ParkingSpaceService service;

    private ParkingSpaceRequest request;
    private ParkingSpace parkingSpace;

    @BeforeEach
    void setup() {
        request = new ParkingSpaceRequest();
        request.setOwnerEmail("owner@example.com");
        request.setTitle("Test Title");
        request.setDescription("Test Description");
        request.setLocation(new GeoJsonPoint(-79.3832, 43.6532));
        request.setPricePerHour(5.0);
        request.setAvailableFrom(LocalDateTime.of(2025, 1, 1, 8, 0));
        request.setAvailableTo(LocalDateTime.of(2025, 1, 1, 18, 0));

        parkingSpace = new ParkingSpace();
        parkingSpace.setOwnerEmail(request.getOwnerEmail());
        parkingSpace.setTitle(request.getTitle());
        parkingSpace.setDescription(request.getDescription());
        parkingSpace.setLocation(request.getLocation());
        parkingSpace.setPricePerHour(request.getPricePerHour());
        parkingSpace.setAvailableFrom(request.getAvailableFrom());
        parkingSpace.setAvailableTo(request.getAvailableTo());
        parkingSpace.setCreatedAt(LocalDateTime.now());
        parkingSpace.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void testCreateParkingSpace() {
        when(repository.save(any(ParkingSpace.class))).thenReturn(parkingSpace);

        ParkingSpaceResponse response = service.createParkingSpace(request);

        assertNotNull(response);
        assertEquals("Test Title", response.getTitle());
        verify(repository, times(1)).save(any(ParkingSpace.class));
    }

    @Test
    void testGetAllParkingSpaces() {
        when(repository.findAll()).thenReturn(List.of(parkingSpace));

        List<ParkingSpaceResponse> result = service.getAllParkingSpaces();

        assertEquals(1, result.size());
        assertEquals("Test Title", result.get(0).getTitle());
        verify(repository, times(1)).findAll();
    }

    @Test
    void testGetParkingSpacesByOwner() {
        when(repository.findByOwnerEmail("owner@example.com")).thenReturn(List.of(parkingSpace));

        List<ParkingSpaceResponse> result = service.getParkingSpacesByOwner("owner@example.com");

        assertEquals(1, result.size());
        assertEquals("Test Title", result.get(0).getTitle());
        verify(repository, times(1)).findByOwnerEmail("owner@example.com");
    }

    @Test
    void testGetParkingSpaceById_Found() {
        when(repository.findById("1")).thenReturn(Optional.of(parkingSpace));

        Optional<ParkingSpaceResponse> result = service.getParkingSpaceById("1");

        assertTrue(result.isPresent());
        assertEquals("Test Title", result.get().getTitle());
        verify(repository, times(1)).findById("1");
    }

    @Test
    void testGetParkingSpaceById_NotFound() {
        when(repository.findById("2")).thenReturn(Optional.empty());

        Optional<ParkingSpaceResponse> result = service.getParkingSpaceById("2");

        assertTrue(result.isEmpty());
        verify(repository, times(1)).findById("2");
    }

    @Test
    void testUpdateParkingSpace_Found() {
        ParkingSpace updated = new ParkingSpace();

        updated.setOwnerEmail(request.getOwnerEmail());
        updated.setTitle("Updated Title");
        updated.setDescription("Updated Description");
        updated.setLocation(request.getLocation());
        updated.setPricePerHour(10.0);
        updated.setAvailableFrom(request.getAvailableFrom());
        updated.setAvailableTo(request.getAvailableTo());
        updated.setCreatedAt(LocalDateTime.now());
        updated.setUpdatedAt(LocalDateTime.now());

        request.setTitle("Updated Title");
        request.setDescription("Updated Description");
        request.setPricePerHour(10.0);

        when(repository.findById("1")).thenReturn(Optional.of(parkingSpace));
        when(repository.save(any(ParkingSpace.class))).thenReturn(updated);

        ParkingSpaceResponse response = service.updateParkingSpace("1", request);

        assertEquals("Updated Title", response.getTitle());
        assertEquals(10.0, response.getPricePerHour());
        verify(repository).findById("1");
        verify(repository).save(any(ParkingSpace.class));
    }

    @Test
    void testUpdateParkingSpace_NotFound() {
        when(repository.findById("999")).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                service.updateParkingSpace("999", request));

        assertEquals("Parking space not found", ex.getMessage());
        verify(repository).findById("999");
    }

    @Test
    void testDeleteParkingSpace() {
        doNothing().when(repository).deleteById("1");

        service.deleteParkingSpace("1");

        verify(repository, times(1)).deleteById("1");
    }
}
