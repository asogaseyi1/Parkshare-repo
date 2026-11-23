package com.backend.Parkshare.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * A short-lived mutual-exclusion lock, one document per parking space
 * currently mid-booking. _id = parkingSpaceId, so MongoDB's built-in unique
 * _id index makes "insert to acquire" atomic for free — a second concurrent
 * insert attempt for the same space fails with a duplicate-key error. See
 * ReservationService.acquireLock / releaseLock.
 *
 * A TTL index on acquiredAt (see MongoIndexInitializer) auto-expires a lock
 * if its holder crashes before releasing it, so a stuck request can't
 * permanently block bookings for that space.
 */
@Document(collection = "reservationLocks")
public class ReservationLock {

    @Id
    private String id;
    private Instant acquiredAt;

    public ReservationLock() {
    }

    public ReservationLock(String id) {
        this.id = id;
        this.acquiredAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Instant getAcquiredAt() {
        return acquiredAt;
    }

    public void setAcquiredAt(Instant acquiredAt) {
        this.acquiredAt = acquiredAt;
    }
}
