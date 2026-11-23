package com.backend.Parkshare.repository;

import com.backend.Parkshare.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    /** Most-recent-first page, for a bounded initial load — the service reverses it to chronological order. */
    List<Message> findByConversationIdOrderBySentAtDesc(String conversationId, Pageable pageable);

    /** Chronological, for polling deltas since the caller's last-seen timestamp. */
    List<Message> findByConversationIdAndSentAtAfterOrderBySentAtAsc(String conversationId, LocalDateTime since);
}
