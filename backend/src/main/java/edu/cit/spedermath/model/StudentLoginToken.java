package edu.cit.spedermath.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class StudentLoginToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String token;

    private Instant expiresAt;
    private boolean used = false;

    @ManyToOne(fetch = FetchType.LAZY)
    private Student student;

    // Getters and setters
    public Long getId() { return id; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }
}
