package com.backend.Parkshare.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * A message thread between a guest and a listing's host, scoped to one
 * listing. parkingSpaceTitle is a denormalized snapshot taken at creation —
 * messaging authorizes off conversation membership only and never re-fetches
 * the live ParkingSpace, so a deleted or renamed listing never breaks
 * rendering an existing thread. Conversations are never cascade-deleted when
 * a listing is removed; history should outlive a delisted space.
 */
@Document(collection = "conversations")
public class Conversation {

    @Id
    private String id;
    private String parkingSpaceId;
    private String parkingSpaceTitle;
    private String hostEmail;
    private String guestEmail;
    private LocalDateTime createdAt;
    private LocalDateTime lastMessageAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getParkingSpaceId() {
        return parkingSpaceId;
    }

    public void setParkingSpaceId(String parkingSpaceId) {
        this.parkingSpaceId = parkingSpaceId;
    }

    public String getParkingSpaceTitle() {
        return parkingSpaceTitle;
    }

    public void setParkingSpaceTitle(String parkingSpaceTitle) {
        this.parkingSpaceTitle = parkingSpaceTitle;
    }

    public String getHostEmail() {
        return hostEmail;
    }

    public void setHostEmail(String hostEmail) {
        this.hostEmail = hostEmail;
    }

    public String getGuestEmail() {
        return guestEmail;
    }

    public void setGuestEmail(String guestEmail) {
        this.guestEmail = guestEmail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastMessageAt() {
        return lastMessageAt;
    }

    public void setLastMessageAt(LocalDateTime lastMessageAt) {
        this.lastMessageAt = lastMessageAt;
    }
}
