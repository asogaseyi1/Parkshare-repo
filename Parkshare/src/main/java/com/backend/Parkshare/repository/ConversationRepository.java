package com.backend.Parkshare.repository;

import com.backend.Parkshare.model.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends MongoRepository<Conversation, String> {
    List<Conversation> findByHostEmailOrGuestEmailOrderByLastMessageAtDesc(String hostEmail, String guestEmail);

    Optional<Conversation> findByParkingSpaceIdAndHostEmailAndGuestEmail(
            String parkingSpaceId, String hostEmail, String guestEmail);
}
