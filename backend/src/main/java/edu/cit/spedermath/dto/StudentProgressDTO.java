package edu.cit.spedermath.dto;

import java.time.LocalDate;
import edu.cit.spedermath.enums.Status;

public class StudentProgressDTO {
    private Long progressID;
    private int score;
    private Status status;
    private LocalDate lastUpdated;
    private Boolean unlocked;
    private Long timeSpentInSeconds;
    private Long lessonId;

    // Getters and Setters
    public Long getProgressID() {
        return progressID;
    }

    public void setProgressID(Long progressID) {
        this.progressID = progressID;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public LocalDate getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDate lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public Boolean getUnlocked() {
        return unlocked;
    }

    public void setUnlocked(Boolean unlocked) {
        this.unlocked = unlocked;
    }

    public Long getTimeSpentInSeconds() {
        return timeSpentInSeconds;
    }

    public void setTimeSpentInSeconds(Long timeSpentInSeconds) {
        this.timeSpentInSeconds = timeSpentInSeconds;
    }

    public Long getLessonId() {
        return lessonId;
    }

    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }
}
