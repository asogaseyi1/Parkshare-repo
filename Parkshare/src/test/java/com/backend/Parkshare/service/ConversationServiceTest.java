package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.ConversationRequest;
import com.backend.Parkshare.exception.BadRequestException;
import com.backend.Parkshare.exception.ForbiddenException;
import com.backend.Parkshare.exception.NotFoundException;
import com.backend.Parkshare.model.Conversation;
import com.backend.Parkshare.model.ParkingSpace;
import com.backend.Parkshare.repository.ConversationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock
    private ConversationRepository repository;

    @Mock
    private ParkingSpaceService parkingSpaceService;

    @Mock
    private MessageService messageService;

    @InjectMocks
    private ConversationService service;

    private ParkingSpace space;
    private ConversationRequest request;

    @BeforeEach
    void setup() {
        space = new ParkingSpace();
        space.setId("space-1");
        space.setTitle("Downtown garage");
        space.setOwnerEmail("host@example.com");

        request = new ConversationRequest();
        request.setParkingSpaceId("space-1");
    }

    @Test
    void createOrGet_rejectsSelfConversation() {
        when(parkingSpaceService.requireExists("space-1")).thenReturn(space);

        assertThrows(BadRequestException.class,
                () -> service.createOrGet("host@example.com", request));
        verify(repository, never()).save(any(Conversation.class));
    }

    @Test
    void createOrGet_returnsExistingThreadInsteadOfDuplicating() {
        when(parkingSpaceService.requireExists("space-1")).thenReturn(space);

        Conversation existing = new Conversation();
        existing.setId("conv-1");
        existing.setParkingSpaceId("space-1");
        existing.setHostEmail("host@example.com");
        existing.setGuestEmail("guest@example.com");
        when(repository.findByParkingSpaceIdAndHostEmailAndGuestEmail("space-1", "host@example.com", "guest@example.com"))
                .thenReturn(Optional.of(existing));

        Conversation result = service.createOrGet("guest@example.com", request);

        assertEquals("conv-1", result.getId());
        verify(repository, never()).save(any(Conversation.class));
    }

    @Test
    void createOrGet_createsNewThreadAndSnapshotsListingTitle() {
        when(parkingSpaceService.requireExists("space-1")).thenReturn(space);
        when(repository.findByParkingSpaceIdAndHostEmailAndGuestEmail("space-1", "host@example.com", "guest@example.com"))
                .thenReturn(Optional.empty());
        when(repository.save(any(Conversation.class))).thenAnswer(inv -> {
            Conversation c = inv.getArgument(0);
            c.setId("conv-new");
            return c;
        });

        Conversation result = service.createOrGet("guest@example.com", request);

        assertEquals("Downtown garage", result.getParkingSpaceTitle());
        assertEquals("host@example.com", result.getHostEmail());
        assertEquals("guest@example.com", result.getGuestEmail());
        verify(messageService, never()).send(any(), any(), any());
    }

    @Test
    void createOrGet_sendsOpeningMessageWhenProvided() {
        request.setInitialMessage("Is this still available?");
        when(parkingSpaceService.requireExists("space-1")).thenReturn(space);
        when(repository.findByParkingSpaceIdAndHostEmailAndGuestEmail("space-1", "host@example.com", "guest@example.com"))
                .thenReturn(Optional.empty());
        when(repository.save(any(Conversation.class))).thenAnswer(inv -> {
            Conversation c = inv.getArgument(0);
            c.setId("conv-new");
            return c;
        });
        when(repository.findById("conv-new")).thenReturn(Optional.empty());

        service.createOrGet("guest@example.com", request);

        verify(messageService).send(eq("conv-new"), eq("guest@example.com"), eq("Is this still available?"));
    }

    @Test
    void requireMembership_rejectsNonMember() {
        Conversation conversation = new Conversation();
        conversation.setId("conv-1");
        conversation.setHostEmail("host@example.com");
        conversation.setGuestEmail("guest@example.com");
        when(repository.findById("conv-1")).thenReturn(Optional.of(conversation));

        assertThrows(ForbiddenException.class,
                () -> service.requireMembership("conv-1", "stranger@example.com"));
    }

    @Test
    void requireMembership_allowsHostAndGuest() {
        Conversation conversation = new Conversation();
        conversation.setId("conv-1");
        conversation.setHostEmail("host@example.com");
        conversation.setGuestEmail("guest@example.com");
        when(repository.findById("conv-1")).thenReturn(Optional.of(conversation));

        assertEquals(conversation, service.requireMembership("conv-1", "host@example.com"));
        assertEquals(conversation, service.requireMembership("conv-1", "guest@example.com"));
    }

    @Test
    void requireMembership_rejectsUnknownConversation() {
        when(repository.findById("missing")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> service.requireMembership("missing", "host@example.com"));
    }

    @Test
    void listForCaller_returnsThreadsAsEitherHostOrGuest() {
        Conversation asHost = new Conversation();
        when(repository.findByHostEmailOrGuestEmailOrderByLastMessageAtDesc("me@example.com", "me@example.com"))
                .thenReturn(List.of(asHost));

        List<Conversation> result = service.listForCaller("me@example.com");

        assertEquals(1, result.size());
    }
}
