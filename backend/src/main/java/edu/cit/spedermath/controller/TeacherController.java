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

    // Endpoint to test the connection
    @GetMapping("/test-connection")
    public ResponseEntity<String> testConnection() {
        // Call the service to test the connection and get the result message
        String result = teacherService.testConnection();
        
        // Return the result message wrapped in a ResponseEntity with an HTTP status
        return new ResponseEntity<>(result, HttpStatus.OK);
    }

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
}
