package com.backend.Parkshare.config;

import com.backend.Parkshare.model.ReservationLock;
import com.backend.Parkshare.model.UserDiscount;
import jakarta.annotation.PostConstruct;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Ensures indexes exist that Spring Data's @Indexed/@CompoundIndex auto-
 * creation (off by default — and should stay off; surprise index builds on
 * deploy are a bad idea once collections have real data) would otherwise
 * create silently or not at all:
 *   - a TTL index on ReservationLock.acquiredAt, so a lock a crashed request
 *     never released is auto-cleaned up instead of permanently blocking that
 *     space's bookings;
 *   - a unique compound index backing UserDiscount's "at most one discount
 *     per (parkingSpaceId, guestEmail)" invariant, as a backstop behind the
 *     atomic upsert DiscountService already uses to create/update one.
 */
@Component
public class MongoIndexInitializer {

    private final MongoTemplate mongoTemplate;

    public MongoIndexInitializer(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @PostConstruct
    public void ensureIndexes() {
        mongoTemplate.indexOps(ReservationLock.class).ensureIndex(
                new Index().on("acquiredAt", Sort.Direction.ASC).expire(Duration.ofSeconds(30)));

        mongoTemplate.indexOps(UserDiscount.class).ensureIndex(
                new CompoundIndexDefinition(org.bson.Document.parse("{'parkingSpaceId': 1, 'guestEmail': 1}"))
                        .named("space_guest_unique")
                        .unique());
    }
}
