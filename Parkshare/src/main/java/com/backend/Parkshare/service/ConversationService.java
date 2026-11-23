package com.backend.Parkshare.service;

import com.backend.Parkshare.dto.ConversationRequest;
import com.backend.Parkshare.exception.BadRequestException;
import com.backend.Parkshare.exception.ForbiddenException;
import com.backend.Parkshare.exception.NotFoundException;
import com.backend.Parkshare.model.Conversation;
import com.backend.Parkshare.model.ParkingSpace;
import com.backend.Parkshare.repository.ConversationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Conversation lifecycle and the membership check every messaging endpoint
 * relies on. Depends on MessageService (one-directional — never the reverse)
 * to post an optional opening message when a thread is first created.
 */
@Service
public class ConversationService {

    private final ConversationRepository repository;
    private final ParkingSpaceService parkingSpaceService;
    private final MessageService messageService;

    public ConversationService(ConversationRepository repository, ParkingSpaceService parkingSpaceService,
                                MessageService messageService) {
        this.repository = repository;
        this.parkingSpaceService = parkingSpaceService;
        this.messageService = messageService;
    }

    /** The caller is always the guest; a listing's owner is always the host — finds or creates. */
    public Conversation createOrGet(String callerEmail, ConversationRequest request) {
        ParkingSpace space = parkingSpaceService.requireExists(request.getParkingSpaceId());

        if (callerEmail.equalsIgnoreCase(space.getOwnerEmail())) {
            throw new BadRequestException("You can't start a conversation with yourself about your own listing.");
        }

        Conversation conversation = repository
                .findByParkingSpaceIdAndHostEmailAndGuestEmail(space.getId(), space.getOwnerEmail(), callerEmail)
                .orElseGet(() -> {
                    Conversation created = new Conversation();
                    created.setParkingSpaceId(space.getId());
                    created.setParkingSpaceTitle(space.getTitle());
                    created.setHostEmail(space.getOwnerEmail());
                    created.setGuestEmail(callerEmail);
                    created.setCreatedAt(LocalDateTime.now());
                    created.setLastMessageAt(LocalDateTime.now());
                    return repository.save(created);
                });

        String opening = request.getInitialMessage();
        if (opening != null && !opening.isBlank()) {
            messageService.send(conversation.getId(), callerEmail, opening);
            touchLastMessageAt(conversation.getId());
        }

        return conversation;
    }

    public List<Conversation> listForCaller(String callerEmail) {
        return repository.findByHostEmailOrGuestEmailOrderByLastMessageAtDesc(callerEmail, callerEmail);
    }

    /** Every messaging endpoint's authorization check — membership only, never a live ParkingSpace lookup. */
    public Conversation requireMembership(String conversationId, String callerEmail) {
        Conversation conversation = repository.findById(conversationId)
                .orElseThrow(() -> new NotFoundException("Conversation not found"));

        boolean isMember = conversation.getHostEmail().equalsIgnoreCase(callerEmail)
                || conversation.getGuestEmail().equalsIgnoreCase(callerEmail);
        if (!isMember) {
            throw new ForbiddenException("You're not part of this conversation.");
        }

        return conversation;
    }

    public void touchLastMessageAt(String conversationId) {
        Optional<Conversation> conversation = repository.findById(conversationId);
        conversation.ifPresent(c -> {
            c.setLastMessageAt(LocalDateTime.now());
            repository.save(c);
        });
    }
}
