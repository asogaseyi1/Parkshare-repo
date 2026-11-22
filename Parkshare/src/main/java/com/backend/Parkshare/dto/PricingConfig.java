package com.backend.Parkshare.dto;

/** Read-only fee rates, so the frontend never hardcodes a figure that could drift from the backend's. */
public class PricingConfig {

    private double guestServiceFeePercent;
    private double hostServiceFeePercent;

    public PricingConfig() {
    }

    public PricingConfig(double guestServiceFeePercent, double hostServiceFeePercent) {
        this.guestServiceFeePercent = guestServiceFeePercent;
        this.hostServiceFeePercent = hostServiceFeePercent;
    }

    public double getGuestServiceFeePercent() {
        return guestServiceFeePercent;
    }

    public void setGuestServiceFeePercent(double guestServiceFeePercent) {
        this.guestServiceFeePercent = guestServiceFeePercent;
    }

    public double getHostServiceFeePercent() {
        return hostServiceFeePercent;
    }

    public void setHostServiceFeePercent(double hostServiceFeePercent) {
        this.hostServiceFeePercent = hostServiceFeePercent;
    }
}
