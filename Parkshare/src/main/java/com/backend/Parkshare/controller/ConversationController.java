package com.backend.Parkshare.controller;

import com.backend.Parkshare.dto.ConversationRequest;
import com.backend.Parkshare.dto.MessageRequest;
import com.backend.Parkshare.model.Conversation;
import com.backend.Parkshare.model.Message;
import com.backend.Parkshare.service.ConversationService;
import com.backend.Parkshare.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private static final int DEFAULT_MESSAGE_LIMIT = 50;

    private final ConversationService conversationService;
    private final MessageService messageService;

    public ConversationController(ConversationService conversationService, MessageService messageService) {
        this.conversationService = conversationService;
        this.messageService = messageService;
    }

    @PostMapping
    public ResponseEntity<Conversation> createOrGet(@Valid @RequestBody ConversationRequest request,
                                                      Authentication authentication) {
        return ResponseEntity.ok(conversationService.createOrGet(authentication.getName(), request));
    }

    @GetMapping
    public ResponseEntity<List<Conversation>> list(Authentication authentication) {
        return ResponseEntity.ok(conversationService.listForCaller(authentication.getName()));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<Message>> listMessages(@PathVariable String id,
                                                         @RequestParam(required = false) LocalDateTime since,
                                                         @RequestParam(required = false) Integer limit,
                                                         Authentication authentication) {
        conversationService.requireMembership(id, authentication.getName());

        if (since != null) {
            return ResponseEntity.ok(messageService.listSince(id, since));
        }
        return ResponseEntity.ok(messageService.listInitial(id, limit != null ? limit : DEFAULT_MESSAGE_LIMIT));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<Message> sendMessage(@PathVariable String id, @Valid @RequestBody MessageRequest request,
                                                 Authentication authentication) {
        conversationService.requireMembership(id, authentication.getName());

        Message message = messageService.send(id, authentication.getName(), request.getBody());
        conversationService.touchLastMessageAt(id);
        return ResponseEntity.ok(message);
    }
}
