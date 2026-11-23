package com.backend.Parkshare.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "reservations")
public class Reservation {

    @Id
    private String id;

    private String userEmail;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean paid;

    @DBRef
    private ParkingSpace parkingSpace;

    // Denormalized from parkingSpace.ownerEmail at booking time — lets the
    // host side of cancel/list queries avoid chasing the DBRef. Same pattern
    // Conversation uses for parkingSpaceTitle.
    private String hostEmail;

    // Set by ReservationService.createReservation once the Stripe charge
    // succeeds — needed to issue a Refund later.
    private String stripePaymentIntentId;

    private boolean cancelled;
    private LocalDateTime cancelledAt;
    private String cancelledBy;
    private String stripeRefundId;
    private double refundAmount;

    // Airbnb-style breakdown, recorded at booking time so it reflects the
    // rate/fees/tax actually charged even if those change later. All in the
    // same currency; see PricingService.
    private String currency;
    private double baseAmount;
    private double guestServiceFee;
    private double tax;
    private double totalCharged;
    private double hostServiceFee;
    private double hostPayout;

    // Set only if a host-entered event rate and/or a standing per-guest
    // discount applied to this booking — see RateResolutionService.
    private double originalPricePerHour;
    private String specialRateName;
    private double discountPercent;

    // Getters and setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public boolean isPaid() {
        return paid;
    }

    public void setPaid(boolean paid) {
        this.paid = paid;
    }

    public ParkingSpace getParkingSpace() {
        return parkingSpace;
    }

    public void setParkingSpace(ParkingSpace parkingSpace) {
        this.parkingSpace = parkingSpace;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public double getBaseAmount() {
        return baseAmount;
    }

    public void setBaseAmount(double baseAmount) {
        this.baseAmount = baseAmount;
    }

    public double getGuestServiceFee() {
        return guestServiceFee;
    }

    public void setGuestServiceFee(double guestServiceFee) {
        this.guestServiceFee = guestServiceFee;
    }

    public double getTax() {
        return tax;
    }

    public void setTax(double tax) {
        this.tax = tax;
    }

    public double getTotalCharged() {
        return totalCharged;
    }

    public void setTotalCharged(double totalCharged) {
        this.totalCharged = totalCharged;
    }

    public double getHostServiceFee() {
        return hostServiceFee;
    }

    public void setHostServiceFee(double hostServiceFee) {
        this.hostServiceFee = hostServiceFee;
    }

    public double getHostPayout() {
        return hostPayout;
    }

    public void setHostPayout(double hostPayout) {
        this.hostPayout = hostPayout;
    }

    public double getOriginalPricePerHour() {
        return originalPricePerHour;
    }

    public void setOriginalPricePerHour(double originalPricePerHour) {
        this.originalPricePerHour = originalPricePerHour;
    }

    public String getSpecialRateName() {
        return specialRateName;
    }

    public void setSpecialRateName(String specialRateName) {
        this.specialRateName = specialRateName;
    }

    public double getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(double discountPercent) {
        this.discountPercent = discountPercent;
    }

    public String getHostEmail() {
        return hostEmail;
    }

    public void setHostEmail(String hostEmail) {
        this.hostEmail = hostEmail;
    }

    public String getStripePaymentIntentId() {
        return stripePaymentIntentId;
    }

    public void setStripePaymentIntentId(String stripePaymentIntentId) {
        this.stripePaymentIntentId = stripePaymentIntentId;
    }

    public boolean isCancelled() {
        return cancelled;
    }

    public void setCancelled(boolean cancelled) {
        this.cancelled = cancelled;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public String getCancelledBy() {
        return cancelledBy;
    }

    public void setCancelledBy(String cancelledBy) {
        this.cancelledBy = cancelledBy;
    }

    public String getStripeRefundId() {
        return stripeRefundId;
    }

    public void setStripeRefundId(String stripeRefundId) {
        this.stripeRefundId = stripeRefundId;
    }

    public double getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(double refundAmount) {
        this.refundAmount = refundAmount;
    }
}
