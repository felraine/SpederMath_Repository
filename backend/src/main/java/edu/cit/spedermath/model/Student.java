package edu.cit.spedermath.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.util.List;

@Entity
@Table(name = "student")
public class Student {

    @Transient
    private String formattedCreatedAt;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long studentID;

    @Column(name = "first_name", nullable = false, length = 100)
    private String fname;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lname;

    @Column(name = "birthdate", nullable = false)
    private LocalDate birthdate;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "created_at", nullable = false)
    private LocalDate createdAt;

    @Column(name = "level", nullable = false)
    private int level;

    @Lob
    @Column(name = "profile_picture")
    private byte[] profilePicture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    @JsonIgnore
    private Teacher teacher;

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("student-progress")
    private List<StudentProgress> progressRecords = new ArrayList<>();

    // Default constructor
    public Student() {
    }

    // Constructor with all fields except ID
    public Student(String fname, String lname, String username, String password, LocalDate birthdate, LocalDate createdAt, int level, byte[] profilePicture, Teacher teacher) {
        this.fname = fname;
        this.lname = lname;
        this.username = username;
        this.password = password;
        this.birthdate = birthdate;
        this.createdAt = createdAt;
        this.level = level;
        this.profilePicture = profilePicture;
        this.teacher = teacher;
    }

    // Getters and Setters
    public Long getStudentID() {
        return studentID;
    }

    public void setStudentID(Long studentID) {
        this.studentID = studentID;
    }

    public String getFName() {
        return fname;
    }

    public void setFName(String fname) {
        this.fname = fname;
    }

    public String getLName() {
        return lname;
    }

    public void setLName(String lname) {
        this.lname = lname;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public LocalDate getBirthdate() {
        return birthdate;
    }

    public void setBirthdate(LocalDate birthdate) {
        this.birthdate = birthdate;
    }

    public byte[] getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(byte[] profilePicture) {
        this.profilePicture = profilePicture;
    }

    public Teacher getTeacher() {
        return teacher;
    }

    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    public String getFormattedCreatedAt() {
        return formattedCreatedAt;
    }

    public void setFormattedCreatedAt(String formattedCreatedAt) {
        this.formattedCreatedAt = formattedCreatedAt;
    }

    public List<StudentProgress> getProgressRecords() {
        return progressRecords;
    }
    public void setProgressRecords(List<StudentProgress> progressRecords) {
        this.progressRecords = progressRecords;
    }
}
