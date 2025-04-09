package edu.cit.spedermath.controller;

import edu.cit.spedermath.model.Student;
import edu.cit.spedermath.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    // Create new student
    @PostMapping
public ResponseEntity<Student> createStudent(@RequestParam String fname,
                                             @RequestParam String lname,
                                             @RequestParam String username,
                                             @RequestParam String birthdate,
                                             @RequestParam(required = false) MultipartFile profilePicture) {
    try {
        LocalDate parsedBirthdate = LocalDate.parse(birthdate);
        Student student = studentService.createStudent(fname, lname, username, parsedBirthdate, profilePicture);
        return new ResponseEntity<>(student, HttpStatus.CREATED);
    } catch (IOException | RuntimeException e) {
        return ResponseEntity.badRequest().build();
    }
}


    // Get student by username
    @GetMapping("/username/{username}")
    public ResponseEntity<Student> getStudentByUsername(@PathVariable String username) {
        Optional<Student> student = studentService.getStudentByUsername(username);
        return student.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Get student by ID
    @GetMapping("/{studentID}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long studentID) {
        Optional<Student> student = studentService.getStudentById(studentID);
        return student.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Edit student
    @PutMapping("/{studentID}")
    public ResponseEntity<Student> updateStudent(@PathVariable Long studentID,
                                                 @RequestParam String fname,
                                                 @RequestParam String lname,
                                                 @RequestParam String username,
                                                 @RequestParam int level,
                                                 @RequestParam(required = false) MultipartFile profilePicture) {
        try {
            Student updatedStudent = studentService.updateStudent(studentID, fname, lname, username, level, profilePicture);
            return new ResponseEntity<>(updatedStudent, HttpStatus.OK);
        } catch (IOException | RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    // Delete student
    @DeleteMapping("/{studentID}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long studentID) {
        try {
            studentService.deleteStudent(studentID);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // Get all students
    @GetMapping("/all")
    public ResponseEntity<List<Student>> getAllStudents() {
        List<Student> students = studentService.getAllStudents();
        
        // Format the created_at field for each student
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM d, yyyy"); // Format: "Month day, year"
        
        for (Student student : students) {
            if (student.getCreatedAt() != null) {
                // Format the created_at field to the desired format
                String formattedDate = student.getCreatedAt().format(formatter);
                student.setFormattedCreatedAt(formattedDate); // Set the formatted date
            }
        }
        
        return new ResponseEntity<>(students, HttpStatus.OK);
    }    
}
