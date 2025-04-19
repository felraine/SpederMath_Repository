package edu.cit.spedermath.model;

import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import edu.cit.spedermath.enums.LessonType;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "lesson")
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long lessonID;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "lesson_type", nullable = false)
    private LessonType lessonType;

    @Column(name = "unlock_threshold", nullable = false)
    private int unlockThreshold;

    @Column(name = "max_score", nullable = false)
    private int max_score;

    @Column(name = "lesson_order")
    private int lessonOrder;

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("lesson-progress") 
    private List<StudentProgress> progressRecords = new ArrayList<>();  

    // Getters and Setters
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LessonType getLessonType() {
        return lessonType;
    }

    public void setLessonType(LessonType lessonType) {
        this.lessonType = lessonType;
    }

    public int getUnlockThreshold() {
        return unlockThreshold;
    }

    public void setUnlockThreshold(int unlockThreshold) {
        this.unlockThreshold = unlockThreshold;
    }
    public List<StudentProgress> getProgressRecords() {
        return progressRecords;
    }
    public void setProgressRecords(List<StudentProgress> progressRecords) {
        this.progressRecords = progressRecords;
    }
    public int getMax_score() {
        return max_score;
    }
    public void setMax_score(int max_score) {
        this.max_score = max_score;
    }
    public int getLessonOrder() {
        return lessonOrder;
    }
    public void setLessonOrder(int lessonOrder) {
        this.lessonOrder = lessonOrder;
    }
}
