package com.backend.Parkshare.dto;

/**
 * Airbnb-style itemized quote: what the guest is charged (rate + ParkShare's
 * guest service fee + federal tax) versus what the host actually nets
 * (rate minus ParkShare's smaller host service fee).
 */
public class PriceBreakdown {

    private double hours;
    private String currency;
    private String countryCode;
    private double pricePerHour;

    // Set only when a host-entered event rate and/or a standing per-guest
    // discount applied (see RateResolutionService) — null/zero otherwise, so
    // the frontend can tell a normal quote from an overridden one.
    private double originalPricePerHour;
    private String specialRateName;
    private double discountPercent;

    private double baseAmount;

    private double guestServiceFeeRate;
    private double guestServiceFee;

    private double taxRate;
    private double tax;

    private double totalCharged;

    private double hostServiceFeeRate;
    private double hostServiceFee;
    private double hostPayout;

    public double getHours() {
        return hours;
    }

    public void setHours(double hours) {
        this.hours = hours;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public double getPricePerHour() {
        return pricePerHour;
    }

    public void setPricePerHour(double pricePerHour) {
        this.pricePerHour = pricePerHour;
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

    public double getBaseAmount() {
        return baseAmount;
    }

    public void setBaseAmount(double baseAmount) {
        this.baseAmount = baseAmount;
    }

    public double getGuestServiceFeeRate() {
        return guestServiceFeeRate;
    }

    public void setGuestServiceFeeRate(double guestServiceFeeRate) {
        this.guestServiceFeeRate = guestServiceFeeRate;
    }

    public double getGuestServiceFee() {
        return guestServiceFee;
    }

    public void setGuestServiceFee(double guestServiceFee) {
        this.guestServiceFee = guestServiceFee;
    }

    public double getTaxRate() {
        return taxRate;
    }

    public void setTaxRate(double taxRate) {
        this.taxRate = taxRate;
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

    public double getHostServiceFeeRate() {
        return hostServiceFeeRate;
    }

    public void setHostServiceFeeRate(double hostServiceFeeRate) {
        this.hostServiceFeeRate = hostServiceFeeRate;
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
}
