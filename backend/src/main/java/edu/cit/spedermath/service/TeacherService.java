package edu.cit.spedermath.service;

import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class TeacherService {
    @Autowired
    private TeacherRepository teacherRepository;

    public String registerTeacher(String name, String email, String password) {
        // Check if email is already registered
        if (teacherRepository.findByEmail(email).isPresent()) {
            return "Email already registered!";
        }
        
        // Create and save teacher with plain text password
        Teacher teacher = new Teacher(name, email, password, LocalDateTime.now());
        teacherRepository.save(teacher);
        return "Registration successful!";
    }

    public String loginTeacher(String email, String password) {
        Optional<Teacher> teacherOptional = teacherRepository.findByEmail(email);
        if (teacherOptional.isEmpty()) {
            return "Invalid email or password!";
        }
        
        Teacher teacher = teacherOptional.get();
        // Direct string comparison instead of password matching
        if (password.equals(teacher.getPassword())) {
            return "Login successful!";
        } else {
            return "Invalid email or password!";
        }
    }

    public String testConnection() {
        Teacher teacher = new Teacher();
        teacher.setName("Test Teacher");
        teacher.setEmail("test@example.com");
        teacher.setPassword("password"); // Plain text password
        teacher.setCreatedAt(LocalDateTime.now());
        teacherRepository.save(teacher);
        return teacherRepository.findById(teacher.getId()).isPresent() ? 
               "Connection successful!" : 
               "Connection failed!";
    }
}