package edu.cit.spedermath.controller;

import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.service.TeacherService;
import edu.cit.spedermath.util.JwtUtil;
import edu.cit.spedermath.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import jakarta.servlet.http.HttpServletRequest;

//testing CORS with localhost:3000
@CrossOrigin(origins = "http://localhost:5173")
//production CORS with web app
//@CrossOrigin(origins = "https://spedermath.web.app")
@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    @Autowired
    private TeacherService teacherService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TeacherRepository teacherRepository;

    @PostMapping("/register")
    public ResponseEntity<String> registerTeacher(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String email = request.get("email");
        String password = request.get("password");

        String response = teacherService.registerTeacher(name, email, password);
        return response.equals("Registration successful!") ?
                new ResponseEntity<>(response, HttpStatus.CREATED) :
                new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> loginTeacher(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
    
        Map<String, String> response = teacherService.loginTeacher(email, password);
        if (response.containsKey("token")) {
            return new ResponseEntity<>(response, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        }
    }    

    @GetMapping("/test-connection")
    public ResponseEntity<String> testConnection() {
        String result = teacherService.testConnection();
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    @GetMapping("/{email}")
    public ResponseEntity<?> getTeacherInfo(@PathVariable String email) {
        Optional<Teacher> teacherOptional = teacherService.getTeacherByEmail(email);
        if (teacherOptional.isPresent()) {
            Teacher teacher = teacherOptional.get();
            Map<String, String> response = Map.of(
                    "name", teacher.getName(),
                    "email", teacher.getEmail()
            );
            return new ResponseEntity<>(response, HttpStatus.OK);
        } else {
            return new ResponseEntity<>("Teacher not found!", HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email").trim();
        String newPassword = request.get("newPassword").trim();

        String response = teacherService.updatePassword(email, newPassword);
        return response.equals("Password updated successfully!") ?
                new ResponseEntity<>(response, HttpStatus.OK) :
                new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<?> getTeacherById(@PathVariable Long id) {
        Optional<Teacher> teacherOptional = teacherService.getTeacherById(id);
        if (teacherOptional.isPresent()) {
            Teacher teacher = teacherOptional.get();
            Map<String, String> response = Map.of(
                    "id", String.valueOf(teacher.getId()),
                    "name", teacher.getName(),
                    "email", teacher.getEmail()
            );
            return new ResponseEntity<>(response, HttpStatus.OK);
        } else {
            return new ResponseEntity<>("Teacher not found!", HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentTeacher(HttpServletRequest request) {
        String token = jwtUtil.extractToken(request);
        if (token == null || !jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or missing token"));
        }

        Long teacherId = jwtUtil.extractTeacherId(token);
        if (teacherId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Token missing teacher id"));
        }

        return teacherRepository.findById(teacherId)
                .<ResponseEntity<?>>map(t -> ResponseEntity.ok(Map.of(
                        "id", t.getId(),
                        "name", t.getName(),
                        "email", t.getEmail()
                )))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("message", "Teacher not found")));
    }

    @PutMapping("/me")
public ResponseEntity<?> updateTeacherProfile(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
    String token = jwtUtil.extractToken(httpRequest);
    if (token == null || !jwtUtil.validateToken(token)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid or missing token"));
    }

    Long teacherId = jwtUtil.extractTeacherId(token);
    if (teacherId == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid token"));
    }

    Optional<Teacher> teacherOptional = teacherRepository.findById(teacherId);
    if (teacherOptional.isEmpty()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Teacher not found"));
    }

    Teacher teacher = teacherOptional.get();

    // Get updated fields from request
    String newName = request.get("name");
    String newEmail = request.get("email");

    if (newName != null && !newName.trim().isEmpty()) {
        teacher.setName(newName.trim());
    }
    if (newEmail != null && !newEmail.trim().isEmpty()) {
        teacher.setEmail(newEmail.trim());
    }

    teacherRepository.save(teacher);

    return ResponseEntity.ok(Map.of(
            "id", String.valueOf(teacher.getId()),
            "name", teacher.getName(),
            "email", teacher.getEmail(),
            "message", "Profile updated successfully!"
    ));
}

@PutMapping("/change-password")
public ResponseEntity<String> changePassword(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
    String token = jwtUtil.extractToken(httpRequest);
    if (token == null || !jwtUtil.validateToken(token)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or missing token");
    }

    Long teacherId = jwtUtil.extractTeacherId(token);
    if (teacherId == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
    }

    Optional<Teacher> teacherOptional = teacherRepository.findById(teacherId);
    if (teacherOptional.isEmpty()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Teacher not found");
    }

    Teacher teacher = teacherOptional.get();

    String oldPassword = request.get("oldPassword");
    String newPassword = request.get("newPassword");
    String confirmPassword = request.get("confirmPassword");

    if (!teacher.getPassword().equals(oldPassword)) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Old password is incorrect");
    }

    if (!newPassword.equals(confirmPassword)) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("New passwords do not match");
    }

    if (oldPassword.equals(newPassword)) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("New password cannot be same as old");
    }

    teacher.setPassword(newPassword);
    teacherRepository.save(teacher);

    return ResponseEntity.ok("Password changed successfully");
}

}
