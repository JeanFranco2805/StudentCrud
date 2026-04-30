package org.delawarex.dbz.boosters.models;

import java.io.Serializable;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

public class PersonalBooster implements Serializable {
    private static final long serialVersionUID = 1L;

    private UUID playerId;
    private int level;
    private double multiplier;
    private Instant activationTime;
    private boolean active;
    private Instant creationTime;

    public PersonalBooster() {
        this.active = false;
    }

    public PersonalBooster(UUID playerId, int level, double multiplier) {
        this.playerId = playerId;
        this.level = level;
        this.multiplier = multiplier;
        this.creationTime = Instant.now();
        this.active = false;
    }

    public void activate(long durationSeconds) {
        this.active = true;
        this.activationTime = Instant.now();
    }

    public void deactivate() {
        this.active = false;
    }

    public boolean isStillActive(long durationSeconds) {
        if (!active || activationTime == null) return false;
        Duration elapsed = Duration.between(activationTime, Instant.now());
        return elapsed.getSeconds() < durationSeconds;
    }

    public long getActivationTimeRemaining(long durationSeconds) {
        if (!active || activationTime == null) return 0;
        Duration elapsed = Duration.between(activationTime, Instant.now());
        long remaining = durationSeconds - elapsed.getSeconds();
        return Math.max(0, remaining);
    }

    public boolean hasExpiredFromStorage(long storageDays) {
        if (creationTime == null) return true;
        Duration age = Duration.between(creationTime, Instant.now());
        return age.toDays() >= storageDays;
    }

    public long getStorageTimeRemaining(long storageDays) {
        if (creationTime == null) return 0;
        Duration age = Duration.between(creationTime, Instant.now());
        long remaining = (storageDays * 86400) - age.getSeconds();
        return Math.max(0, remaining);
    }

    public int getPercentageBonus() {
        return (int) ((multiplier - 1.0) * 100);
    }

    public String getLevelName() {
        switch (level) {
            case 1: return "Minor";
            case 2: return "Standard";
            case 3: return "Powerful";
            case 4: return "Extreme";
            case 5: return "Ultimate";
            default: return "Unknown";
        }
    }

    public UUID getPlayerId() { return playerId; }
    public void setPlayerId(UUID playerId) { this.playerId = playerId; }
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    public double getMultiplier() { return multiplier; }
    public void setMultiplier(double multiplier) { this.multiplier = multiplier; }
    public Instant getActivationTime() { return activationTime; }
    public void setActivationTime(Instant activationTime) { this.activationTime = activationTime; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreationTime() { return creationTime; }
    public void setCreationTime(Instant creationTime) { this.creationTime = creationTime; }
}
