package com.backend.Parkshare.config;

import com.backend.Parkshare.model.ReservationLock;
import jakarta.annotation.PostConstruct;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Ensures the TTL index on ReservationLock.acquiredAt exists, so a lock a
 * crashed request never released is auto-cleaned up by MongoDB instead of
 * permanently blocking that space's bookings. Created explicitly here rather
 * than relying on Spring Data's @Indexed auto-creation, which is off by
 * default — and should stay off; surprise index builds on deploy are a bad
 * idea once collections have real data.
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
    }
}
