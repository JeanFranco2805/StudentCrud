package org.delawarex.dbz.boosters.models;

import java.io.Serializable;
import java.time.Instant;

public class GlobalBooster implements Serializable {
    private static final long serialVersionUID = 1L;

    private double multiplier;
    private Instant startTime;
    private Instant endTime;
    private boolean active;
    private String activatedBy;

    public GlobalBooster() {
        this.active = false;
    }

    public GlobalBooster(double multiplier, Instant startTime, Instant endTime, String activatedBy) {
        this.multiplier = multiplier;
        this.startTime = startTime;
        this.endTime = endTime;
        this.active = true;
        this.activatedBy = activatedBy;
    }

    public long getRemainingSeconds() {
        if (!active || endTime == null) return 0;
        long remaining = endTime.getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, remaining);
    }

    public boolean hasExpired() {
        if (!active || endTime == null) return true;
        return Instant.now().isAfter(endTime);
    }

    public void deactivate() {
        this.active = false;
    }

    public String getFormattedTime() {
        long seconds = getRemainingSeconds();
        if (seconds <= 0) return "0s";
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;
        StringBuilder sb = new StringBuilder();
        if (hours > 0) sb.append(hours).append("h ");
        if (minutes > 0) sb.append(minutes).append("m ");
        if (secs > 0) sb.append(secs).append("s");
        return sb.toString().trim();
    }

    public int getPercentageBonus() {
        return (int) ((multiplier - 1.0) * 100);
    }

    public double getMultiplier() { return multiplier; }
    public void setMultiplier(double multiplier) { this.multiplier = multiplier; }
    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getActivatedBy() { return activatedBy; }
    public void setActivatedBy(String activatedBy) { this.activatedBy = activatedBy; }
}
