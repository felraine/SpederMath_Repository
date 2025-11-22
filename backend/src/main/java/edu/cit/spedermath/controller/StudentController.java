package edu.cit.spedermath.controller;

import edu.cit.spedermath.model.Student;
import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.service.StudentService;
import edu.cit.spedermath.repository.TeacherRepository;
import edu.cit.spedermath.util.JwtUtil;
import edu.cit.spedermath.service.StudentLoginTokenService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private StudentLoginTokenService tokenService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TeacherRepository teacherRepository;

    @Value("${app.publicApiBaseUrl}")
    private String publicApiBaseUrl;

    // --- helper: extract bearer token robustly ---
    private String extractBearerToken(HttpServletRequest request, String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        String h = request.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ")) {
            return h.substring(7);
        }
        return null;
    }

    @PostMapping("/create")
    public ResponseEntity<Student> createStudent(@RequestParam String fname,
                                                 @RequestParam String lname,
                                                 @RequestParam String username,
                                                 @RequestParam String birthdate,
                                                 @RequestParam(required = false) MultipartFile profilePicture,
                                                 @RequestHeader(value = "Authorization", required = false) String authHeader,
                                                 HttpServletRequest request) {
        try {
            String token = extractBearerToken(request, authHeader);
            if (token == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

            Long teacherId = jwtUtil.extractTeacherId(token);
            LocalDate parsedBirthdate = LocalDate.parse(birthdate);

            Student student = studentService.createStudent(
                    fname, lname, username, parsedBirthdate, profilePicture, teacherId);

            return new ResponseEntity<>(student, HttpStatus.CREATED);
        } catch (IOException | RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<Student> getStudentByUsername(@PathVariable String username) {
        Optional<Student> student = studentService.getStudentByUsername(username);
        return student.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{studentID}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long studentID) {
        Optional<Student> student = studentService.getStudentById(studentID);
        return student.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{studentID}")
    public ResponseEntity<Student> updateStudent(@PathVariable Long studentID,
                                                 @RequestParam String fname,
                                                 @RequestParam String lname,
                                                 @RequestParam String username,
                                                 @RequestParam(required = false) MultipartFile profilePicture,
                                                 @RequestHeader(value = "Authorization", required = false) String authHeader,
                                                 HttpServletRequest request) {
        try {
            String token = extractBearerToken(request, authHeader);
            if (token == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

            Long teacherId = jwtUtil.extractTeacherId(token);
            Student updatedStudent = studentService.updateStudent(
                    studentID, fname, lname, username, profilePicture, teacherId);

            return new ResponseEntity<>(updatedStudent, HttpStatus.OK);
        } catch (IOException | RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{studentID}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long studentID) {
        try {
            studentService.deleteStudent(studentID);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // 🔒 requires valid JWT
    @GetMapping("/all")
    public ResponseEntity<List<Student>> getAllStudents(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest request) {

        String token = extractBearerToken(request, authHeader);
        if (token == null) return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        Long teacherId = jwtUtil.extractTeacherId(token);
        // System.out.println("Teacher ID (students/all): " + teacherId);

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

    @GetMapping("/{studentID}/login")
    public ResponseEntity<String> getLoginUrl(@PathVariable Long studentID) {
        String loginUrl = "https://spedermath.app/login/" + studentID;
        return new ResponseEntity<>(loginUrl, HttpStatus.OK);
    }

    @PostMapping("/{studentId}/qr-token")
    public ResponseEntity<Map<String, String>> createQrToken(@PathVariable Long studentId) {
        Student s = studentService.getStudentById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found."));

        String token = tokenService.createTokenForStudent(s);
        String qrUrl = publicApiBaseUrl + "/public/qr-login?token=" +
                URLEncoder.encode(token, StandardCharsets.UTF_8);

        return ResponseEntity.ok(Map.of("qrUrl", qrUrl));
    }
}
