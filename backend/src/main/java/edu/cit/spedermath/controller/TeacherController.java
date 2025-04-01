package edu.cit.spedermath.controller;
 
import edu.cit.spedermath.service.TeacherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
import java.util.Map;
 
@RestController
@RequestMapping("/api/teachers")
public class TeacherController {
 
    @Autowired
    private TeacherService teacherService;
 
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
    public ResponseEntity<String> loginTeacher(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
 
        String response = teacherService.loginTeacher(email, password);
        return response.equals("Login successful!") ? 
                new ResponseEntity<>(response, HttpStatus.OK) : 
                new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }
 
    // Endpoint to test connection
    @GetMapping("/test-connection")
    public ResponseEntity<String> testConnection() {
        String result = teacherService.testConnection();
        return new ResponseEntity<>(result, HttpStatus.OK);
    }
}