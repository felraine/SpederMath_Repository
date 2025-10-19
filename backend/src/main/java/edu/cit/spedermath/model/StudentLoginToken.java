package edu.cit.spedermath.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class StudentLoginToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 72)
    private String token;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean used;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Student student;

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
