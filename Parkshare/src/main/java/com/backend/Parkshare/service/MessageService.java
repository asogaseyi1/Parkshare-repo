package com.backend.Parkshare.service;

import com.backend.Parkshare.model.Message;
import com.backend.Parkshare.repository.MessageRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * Pure message read/write — no authorization here. Callers (ConversationController)
 * always check conversation membership via ConversationService first. Kept
 * one-directional (this never depends on ConversationService) so the two
 * services don't form a circular dependency.
 */
@Service
public class MessageService {

    private final MessageRepository repository;

    public MessageService(MessageRepository repository) {
        this.repository = repository;
    }

    public Message send(String conversationId, String senderEmail, String body) {
        Message message = new Message();
        message.setConversationId(conversationId);
        message.setSenderEmail(senderEmail);
        message.setBody(body);
        message.setSentAt(LocalDateTime.now());
        return repository.save(message);
    }

    /** Bounded initial load (most recent `limit`), oldest-first for display. */
    public List<Message> listInitial(String conversationId, int limit) {
        List<Message> recent = repository.findByConversationIdOrderBySentAtDesc(
                conversationId, PageRequest.of(0, limit));
        Collections.reverse(recent);
        return recent;
    }

    /** Polling delta — messages after the caller's last-seen timestamp, oldest-first. */
    public List<Message> listSince(String conversationId, LocalDateTime since) {
        return repository.findByConversationIdAndSentAtAfterOrderBySentAtAsc(conversationId, since);
    }
}
