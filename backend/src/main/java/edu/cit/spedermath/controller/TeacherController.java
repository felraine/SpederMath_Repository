package edu.cit.spedermath.controller;

import edu.cit.spedermath.service.TeacherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
