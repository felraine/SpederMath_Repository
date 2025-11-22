package edu.cit.spedermath.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "teacher")
public class Teacher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long teacherID;

    @Column(name = "fname", length = 100)
    private String fname;

    @Column(name = "lname", length = 100)
    private String lname;

    @Column(name = "name", nullable = false, length = 100)
    private String name; // username

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Lob
    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(name = "photo_blob", columnDefinition = "BYTEA")
    private byte[] photoBlob;

    @Column(name = "google_id", length = 255, unique = true)
    private String googleId;

    @OneToMany(mappedBy = "teacher", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Student> students = new ArrayList<>();

    public Teacher() {}

    // Constructor without ID
    public Teacher(String fname, String lname, String name, String email, String password, LocalDateTime createdAt) {
        this.fname = fname;
        this.lname = lname;
        this.name = name;
        this.email = email;
        this.password = password;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() {
        return teacherID;
    }

    public void setId(Long teacherID) {
        this.teacherID = teacherID;
    }

    public String getFname() {
        return fname;
    }

    public void setFname(String fname) {
        this.fname = fname;
    }

    public String getLname() {
        return lname;
    }

    public void setLname(String lname) {
        this.lname = lname;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<Student> getStudents() {
        return students;
    }

    public void setStudents(List<Student> students) {
        this.students = students;
    }

    public byte[] getPhotoBlob() { return photoBlob; }
    public void setPhotoBlob(byte[] photoBlob) { this.photoBlob = photoBlob; }

    public String getGoogleId() {
        return googleId;
    }

    public void setGoogleId(String googleId) {
        this.googleId = googleId;
    }


    //functions
  /*  public void addStudent(Student student) {
        students.add(student);
        student.setTeacher(this);
    }

    public void removeStudent(Student student) {
        students.remove(student);
        student.setTeacher(null);
    }*/
}
