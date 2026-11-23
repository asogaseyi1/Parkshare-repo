package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.SpecialRateRequest;
import com.backend.Parkshare.exception.BadRequestException;
import com.backend.Parkshare.exception.ConflictException;
import com.backend.Parkshare.exception.ForbiddenException;
import com.backend.Parkshare.exception.NotFoundException;
import com.backend.Parkshare.model.ParkingSpace;
import com.backend.Parkshare.model.SpecialRate;
import com.backend.Parkshare.repository.SpecialRateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SpecialRateServiceTest {

    @Mock
    private SpecialRateRepository repository;

    @Mock
    private ParkingSpaceService parkingSpaceService;

    @InjectMocks
    private SpecialRateService service;

    private SpecialRateRequest request;
    private ParkingSpace space;

    @BeforeEach
    void setup() {
        request = new SpecialRateRequest();
        request.setName("Leafs home game");
        request.setStartTime(LocalDateTime.of(2026, 12, 5, 18, 0));
        request.setEndTime(LocalDateTime.of(2026, 12, 5, 23, 0));
        request.setPricePerHour(18.0);

        space = new ParkingSpace();
        space.setId("space-1");
        space.setOwnerEmail("host@example.com");
    }

    @Test
    void create_rejectsWhenCallerIsNotOwner() {
        when(parkingSpaceService.requireOwnership("space-1", "intruder@example.com"))
                .thenThrow(new ForbiddenException("You don't own this listing."));

        assertThrows(ForbiddenException.class,
                () -> service.create("space-1", "intruder@example.com", request));
        verify(repository, never()).save(any(SpecialRate.class));
    }

    @Test
    void create_rejectsEndTimeAtOrBeforeStartTime() {
        when(parkingSpaceService.requireOwnership("space-1", "host@example.com")).thenReturn(space);
        request.setEndTime(request.getStartTime());

        assertThrows(BadRequestException.class, () -> service.create("space-1", "host@example.com", request));
    }

    @Test
    void create_rejectsOverlappingWindow() {
        when(parkingSpaceService.requireOwnership("space-1", "host@example.com")).thenReturn(space);

        SpecialRate existing = new SpecialRate();
        existing.setStartTime(LocalDateTime.of(2026, 12, 5, 20, 0));
        existing.setEndTime(LocalDateTime.of(2026, 12, 5, 22, 0)); // overlaps request's 18:00-23:00
        when(repository.findByParkingSpaceId("space-1")).thenReturn(List.of(existing));

        assertThrows(ConflictException.class, () -> service.create("space-1", "host@example.com", request));
        verify(repository, never()).save(any(SpecialRate.class));
    }

    @Test
    void create_allowsBackToBackNonOverlappingWindows() {
        when(parkingSpaceService.requireOwnership("space-1", "host@example.com")).thenReturn(space);

        SpecialRate existing = new SpecialRate();
        existing.setStartTime(LocalDateTime.of(2026, 12, 5, 12, 0));
        existing.setEndTime(request.getStartTime()); // ends exactly when the new one starts — not an overlap
        when(repository.findByParkingSpaceId("space-1")).thenReturn(List.of(existing));
        when(repository.save(any(SpecialRate.class))).thenAnswer(inv -> inv.getArgument(0));

        SpecialRate saved = service.create("space-1", "host@example.com", request);

        assertEquals("host@example.com", saved.getOwnerEmail());
        assertEquals("Leafs home game", saved.getName());
    }

    @Test
    void listUpcoming_excludesExpiredRates() {
        when(parkingSpaceService.requireExists("space-1")).thenReturn(space);

        SpecialRate past = new SpecialRate();
        past.setEndTime(LocalDateTime.now().minusDays(1));
        SpecialRate upcoming = new SpecialRate();
        upcoming.setEndTime(LocalDateTime.now().plusDays(1));
        when(repository.findByParkingSpaceId("space-1")).thenReturn(List.of(past, upcoming));

        List<SpecialRate> result = service.listUpcoming("space-1");

        assertEquals(1, result.size());
        assertEquals(upcoming, result.get(0));
    }

    @Test
    void delete_rejectsWhenRateBelongsToDifferentSpace() {
        when(parkingSpaceService.requireOwnership("space-1", "host@example.com")).thenReturn(space);

        SpecialRate rate = new SpecialRate();
        rate.setParkingSpaceId("some-other-space");
        when(repository.findById("rate-1")).thenReturn(Optional.of(rate));

        assertThrows(NotFoundException.class,
                () -> service.delete("space-1", "rate-1", "host@example.com"));
        verify(repository, never()).deleteById("rate-1");
    }
}
