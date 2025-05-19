package com.backend.Parkshare.dto;

import com.backend.Parkshare.model.ParkingSpace;
import lombok.Data;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

import java.time.LocalDateTime;

@Data
public class ParkingSpaceResponse {

    private String id;
    private String ownerEmail;
    private String title;
    private String description;
    private GeoJsonPoint location;
    private double pricePerHour;
    private LocalDateTime availableFrom;
    private LocalDateTime availableTo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


    public ParkingSpaceResponse() {
    }

    public static ParkingSpaceResponse fromEntity(ParkingSpace space) {
        ParkingSpaceResponse dto = new ParkingSpaceResponse();
        dto.setId(space.getId()); // Map the MongoDB _id
        dto.setOwnerEmail(space.getOwnerEmail());
        dto.setTitle(space.getTitle());
        dto.setDescription(space.getDescription());
        dto.setLocation(space.getLocation());
        dto.setPricePerHour(space.getPricePerHour());
        dto.setAvailableFrom(space.getAvailableFrom());
        dto.setAvailableTo(space.getAvailableTo());
        dto.setCreatedAt(space.getCreatedAt());
        dto.setUpdatedAt(space.getUpdatedAt());
        return dto;
    }


    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public GeoJsonPoint getLocation() {
        return location;
    }

    public void setLocation(GeoJsonPoint location) {
        this.location = location;
    }

    public double getPricePerHour() {
        return pricePerHour;
    }

    public void setPricePerHour(double pricePerHour) {
        this.pricePerHour = pricePerHour;
    }

    public LocalDateTime getAvailableFrom() {
        return availableFrom;
    }

    public void setAvailableFrom(LocalDateTime availableFrom) {
        this.availableFrom = availableFrom;
    }

    public LocalDateTime getAvailableTo() {
        return availableTo;
    }

    public void setAvailableTo(LocalDateTime availableTo) {
        this.availableTo = availableTo;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
