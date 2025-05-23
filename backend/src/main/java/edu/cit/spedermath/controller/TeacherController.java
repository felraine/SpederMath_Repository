package edu.cit.spedermath.controller;

import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.service.TeacherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

//testing CORS with localhost:3000
@CrossOrigin(origins = "http://localhost:5173")
//production CORS with web app
//@CrossOrigin(origins = "https://spedermath.web.app")
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
}
