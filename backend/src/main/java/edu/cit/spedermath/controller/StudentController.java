package edu.cit.spedermath.controller;

import edu.cit.spedermath.model.Student;
import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.service.StudentService;
import edu.cit.spedermath.repository.TeacherRepository; 
import edu.cit.spedermath.util.JwtUtil;
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
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TeacherRepository teacherRepository;  // Autowire TeacherRepository

    // Create new student
    @PostMapping("/create")
    public ResponseEntity<Student> createStudent(@RequestParam String fname,
                                                 @RequestParam String lname,
                                                 @RequestParam String username,
                                                 @RequestParam String birthdate,
                                                 @RequestParam(required = false) MultipartFile profilePicture,
                                                 @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract teacherId from JWT token
            String token = authHeader.substring(7);  // Remove "Bearer " prefix
            Long teacherId = jwtUtil.extractTeacherId(token); // Extract teacherId
    
            // Parse birthdate
            LocalDate parsedBirthdate = LocalDate.parse(birthdate);
    
            // Create student
            Student student = studentService.createStudent(fname, lname, username, parsedBirthdate, profilePicture, teacherId);
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
                                                  @RequestParam(required = false) Integer level,
                                                  @RequestParam(required = false) MultipartFile profilePicture,
                                                  @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract teacherId from JWT token
            String token = authHeader.substring(7);  // Remove "Bearer " prefix
            Long teacherId = jwtUtil.extractTeacherId(token); // Extract teacherId
    
            // Update student
            Student updatedStudent = studentService.updateStudent(studentID, fname, lname, username, level, profilePicture, teacherId);
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
    public ResponseEntity<List<Student>> getAllStudents(HttpServletRequest request) {
        String token = jwtUtil.extractToken(request);
    
        if (token == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
    
        Long teacherId = jwtUtil.extractTeacherId(token);
        System.out.println("Teacher ID: " + teacherId);  // Debugging
    
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
    
        List<Student> students = studentService.getStudentsByTeacher(teacher);
    
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM d, yyyy");
    
        for (Student student : students) {
            if (student.getCreatedAt() != null) {
                String formattedDate = student.getCreatedAt().format(formatter);
                student.setFormattedCreatedAt(formattedDate);
            }
        }
    
        return new ResponseEntity<>(students, HttpStatus.OK);
    }   
    
    @PostMapping("/student-login")
    public ResponseEntity<Map<String, String>> loginStudent(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
    
        Map<String, String> response = studentService.loginStudent(username, password);
        if (response.containsKey("token")) {
            return new ResponseEntity<>(response, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        }
    }

    // Add this method to handle the login URL generation
    @GetMapping("/{studentID}/login")
    public ResponseEntity<String> getLoginUrl(@PathVariable Long studentID) {
        String loginUrl = "http://localhost:5173/login/" + studentID;
        return new ResponseEntity<>(loginUrl, HttpStatus.OK);
    }
}
