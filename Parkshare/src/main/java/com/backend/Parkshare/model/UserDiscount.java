package com.backend.Parkshare.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * A standing per-guest discount a host has granted on one listing — e.g.
 * "jane@example.com gets 15% off my driveway" — applied automatically to
 * that guest's future bookings there until the host removes it (see
 * RateResolutionService). At most one per (parkingSpaceId, guestEmail): see
 * the compound index below, enforced via MongoIndexInitializer since
 * @Indexed auto-creation is off.
 */
@Document(collection = "userDiscounts")
@CompoundIndex(name = "space_guest_unique", def = "{'parkingSpaceId': 1, 'guestEmail': 1}", unique = true)
public class UserDiscount {

    @Id
    private String id;
    private String parkingSpaceId;
    private String ownerEmail;
    private String guestEmail;
    private double percentOff;
    private LocalDateTime createdAt;

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

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getGuestEmail() {
        return guestEmail;
    }

    public void setGuestEmail(String guestEmail) {
        this.guestEmail = guestEmail;
    }

    public double getPercentOff() {
        return percentOff;
    }

    public void setPercentOff(double percentOff) {
        this.percentOff = percentOff;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
