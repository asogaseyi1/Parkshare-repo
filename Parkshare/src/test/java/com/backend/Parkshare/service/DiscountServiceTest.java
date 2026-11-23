package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.UserDiscountRequest;
import com.backend.Parkshare.exception.BadRequestException;
import com.backend.Parkshare.exception.ForbiddenException;
import com.backend.Parkshare.exception.NotFoundException;
import com.backend.Parkshare.model.ParkingSpace;
import com.backend.Parkshare.model.User;
import com.backend.Parkshare.model.UserDiscount;
import com.backend.Parkshare.repository.UserDiscountRepository;
import com.backend.Parkshare.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiscountServiceTest {

    @Mock
    private UserDiscountRepository repository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ParkingSpaceService parkingSpaceService;

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private DiscountService service;

    private UserDiscountRequest request;
    private ParkingSpace space;

    @BeforeEach
    void setup() {
        request = new UserDiscountRequest();
        request.setGuestEmail("jane@example.com");
        request.setPercentOff(15.0);

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
    }

    @Test
    void create_rejectsWhenGuestHasNoAccount() {
        when(parkingSpaceService.requireOwnership("space-1", "host@example.com")).thenReturn(space);
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> service.create("space-1", "host@example.com", request));
        verify(mongoTemplate, never()).findAndModify(any(), any(), any(FindAndModifyOptions.class), eq(UserDiscount.class));
    }

    @Test
    void create_upsertsAtomicallyWhenGuestExists() {
        when(parkingSpaceService.requireOwnership("space-1", "host@example.com")).thenReturn(space);
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(new User()));

        UserDiscount expected = new UserDiscount();
        expected.setParkingSpaceId("space-1");
        expected.setGuestEmail("jane@example.com");
        expected.setPercentOff(15.0);
        when(mongoTemplate.findAndModify(any(Query.class), any(Update.class),
                any(FindAndModifyOptions.class), eq(UserDiscount.class))).thenReturn(expected);

        UserDiscount result = service.create("space-1", "host@example.com", request);

        assertEquals(expected, result);
        // Upsert, not create-or-reject — granting again to the same guest should
        // update the percentage rather than erroring or duplicating the row.
        verify(mongoTemplate).findAndModify(any(Query.class), any(Update.class),
                org.mockito.ArgumentMatchers.argThat(opts -> opts.isUpsert() && opts.isReturnNew()),
                eq(UserDiscount.class));
    }

    @Test
    void list_isOwnerOnlyNotJustExistence() {
        when(parkingSpaceService.requireOwnership("space-1", "host@example.com")).thenReturn(space);
        when(repository.findByParkingSpaceId("space-1")).thenReturn(java.util.List.of());

        service.list("space-1", "host@example.com");

        verify(parkingSpaceService).requireOwnership("space-1", "host@example.com");
    }

    @Test
    void delete_rejectsWhenDiscountBelongsToDifferentSpace() {
        when(parkingSpaceService.requireOwnership("space-1", "host@example.com")).thenReturn(space);

        UserDiscount discount = new UserDiscount();
        discount.setParkingSpaceId("some-other-space");
        when(repository.findById("discount-1")).thenReturn(Optional.of(discount));

        assertThrows(NotFoundException.class,
                () -> service.delete("space-1", "discount-1", "host@example.com"));
        verify(repository, never()).deleteById("discount-1");
    }
}
