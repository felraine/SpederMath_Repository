package edu.cit.spedermath.dto;

import java.time.LocalDateTime;

import edu.cit.spedermath.enums.LessonType;

public class AttemptHistoryDTO {
    private Long attemptId;
    private Long lessonId;
    private String lessonTitle;
    private Integer score;
    private String status;
    private Integer timeSpentSeconds;
    private LocalDateTime attemptedAt;
    private LessonType lessonType;
    private Integer lessonOrder;

    public AttemptHistoryDTO() {}

    public AttemptHistoryDTO(Long attemptId, Long lessonId, String lessonTitle,
                             Integer score, String status, Integer timeSpentSeconds,
                             LocalDateTime attemptedAt, LessonType lessonType, Integer lessonOrder) {
        this.attemptId = attemptId;
        this.lessonId = lessonId;
        this.lessonTitle = lessonTitle;
        this.score = score;
        this.status = status;
        this.timeSpentSeconds = timeSpentSeconds;
        this.attemptedAt = attemptedAt;
        this.lessonType = lessonType;
        this.lessonOrder = lessonOrder;
    }

    public Long getAttemptId() { return attemptId; }
    public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }
    public String getLessonTitle() { return lessonTitle; }
    public void setLessonTitle(String lessonTitle) { this.lessonTitle = lessonTitle; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getTimeSpentSeconds() { return timeSpentSeconds; }
    public void setTimeSpentSeconds(Integer timeSpentSeconds) { this.timeSpentSeconds = timeSpentSeconds; }
    public LocalDateTime getAttemptedAt() { return attemptedAt; }
    public void setAttemptedAt(LocalDateTime attemptedAt) { this.attemptedAt = attemptedAt; }
    public LessonType getLessonType() { return lessonType; }
    public void setLessonType(LessonType lessonType) { this.lessonType = lessonType; }
    public Integer getLessonOrder() { return lessonOrder; }
    public void setLessonOrder(Integer lessonOrder) { this.lessonOrder = lessonOrder; }
}
