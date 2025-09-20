package edu.cit.spedermath.dto;

import edu.cit.spedermath.enums.LessonType;

public class LessonStatsDTO {
    private Long lessonID;
    private String title;
    private Double avgScore;
    private Double avgTimeSpent;
    private Long retakesCount;
    private Long unlockedCount;
    private Long notUnlockedCount;
    private Long completedCount;
    private Long inProgressCount;
    private Long notStartedCount;
    private Long failedCount;
    private LessonType lessonType;

    // Constructor
    public LessonStatsDTO(Long lessonID, String title, Double avgScore, Double avgTimeSpent, Long retakesCount,
            Long unlockedCount, Long notUnlockedCount, Long completedCount, Long inProgressCount,
            Long notStartedCount, Long failedCount, LessonType lessonType) {
        this.lessonID = lessonID;
        this.title = title;
        this.avgScore = avgScore;
        this.avgTimeSpent = avgTimeSpent;
        this.retakesCount = retakesCount;
        this.unlockedCount = unlockedCount;
        this.notUnlockedCount = notUnlockedCount;
        this.completedCount = completedCount;
        this.inProgressCount = inProgressCount;
        this.notStartedCount = notStartedCount;
        this.failedCount = failedCount;
        this.lessonType = lessonType;
        }


    // Getters and setters
    public Long getLessonID() {
        return lessonID;
    }
    public void setLessonID(Long lessonID) {
        this.lessonID = lessonID;
    }
    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }
    public Double getAvgScore() {
        return avgScore == null ? null : Math.round(avgScore * 10) / 10.0;
    }
    public void setAvgScore(Double avgScore) {
        this.avgScore = avgScore;
    }
    public Double getAvgTimeSpent() {
        return avgTimeSpent == null ? null : Math.round(avgTimeSpent * 10) / 10.0;
    }
    public void setAvgTimeSpent(Double avgTimeSpent) {
        this.avgTimeSpent = avgTimeSpent;
    }
    public Long getRetakesCount() {
        return retakesCount;
    }
    public void setRetakesCount(Long retakesCount) {
        this.retakesCount = retakesCount;
    }
    public Long getUnlockedCount() {
        return unlockedCount;
    }
    public void setUnlockedCount(Long unlockedCount) {
        this.unlockedCount = unlockedCount;
    }
    public Long getNotUnlockedCount() {
        return notUnlockedCount;
    }
    public void setNotUnlockedCount(Long notUnlockedCount) {
        this.notUnlockedCount = notUnlockedCount;
    }
    public Long getCompletedCount() {
        return completedCount;
    }
    public void setCompletedCount(Long completedCount) {
        this.completedCount = completedCount;
    }
    public Long getInProgressCount() {
        return inProgressCount;
    }
    public void setInProgressCount(Long inProgressCount) {
        this.inProgressCount = inProgressCount;
    }
    public Long getNotStartedCount() {
        return notStartedCount;
    }
    public void setNotStartedCount(Long notStartedCount) {
        this.notStartedCount = notStartedCount;
    }
    public Long getFailedCount() {
        return failedCount;
    }
    public void setFailedCount(Long failedCount) {
        this.failedCount = failedCount;
    }
    public LessonType getLessonType() {
        return lessonType;
    }
    public void setLessonType(LessonType lessonType) {
        this.lessonType = lessonType;
    }
}
