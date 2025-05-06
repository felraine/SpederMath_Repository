package edu.cit.spedermath.model;

import edu.cit.spedermath.enums.Status;
import jakarta.persistence.*;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "student_progress")
public class StudentProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long progressID;

    @Column(name = "score", nullable = false)
    private int score;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status;

    @Column(name = "last_updated")
    private LocalDate lastUpdated;

    @Column(name = "unlocked", nullable = false)
    private boolean unlocked;

    @Column(name = "time_spent_seconds")
    private Long timeSpentInSeconds; // duration

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonBackReference("student-progress") 
    private Student student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lesson_id", nullable = false)
    @JsonBackReference("lesson-progress")
    private Lesson lesson;

    // Default constructor
    public StudentProgress() {}

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

    public boolean isUnlocked() {
        return unlocked;
    }

    public void setUnlocked(boolean unlocked) {
        this.unlocked = unlocked;
    }

    public Long getTimeSpentInSeconds() {
        return timeSpentInSeconds;
    }

    public void setTimeSpentInSeconds(Long timeSpentInSeconds) {
        this.timeSpentInSeconds = timeSpentInSeconds;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    @JsonProperty("lesson_id")
    public Lesson getLesson() {
        return lesson;
    }

    public void setLesson(Lesson lesson) {
        this.lesson = lesson;
    }
}