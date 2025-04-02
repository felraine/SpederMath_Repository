package edu.cit.spedermath.service;

import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.repository.TeacherRepository;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TeacherService {

    @Autowired
    private TeacherRepository teacherRepository;

    public String testConnection() {
        // Test the connection by saving a new teacher and checking if it exists in the database
        // This is a simple test and should be replaced with proper unit tests in a real application
        Teacher teacher = new Teacher();
        teacher.setName("Test Teacher 1");
        teacher.setEmail("test23@example.com");
        teacher.setPassword("password");
        teacher.setCreatedAt(java.time.LocalDateTime.now());

        teacherRepository.save(teacher);

        return teacherRepository.findById(teacher.getId()).isPresent() ? "Connection successful!" : "Connection failed!";
    }

        public String registerTeacher(String name, String email, String password) {
        // Check if email is already registered
        if (teacherRepository.findByEmail(email).isPresent()) {
            return "Email already registered!";
        }
 
        // Create and save teacher
        Teacher teacher = new Teacher(name, email, password, LocalDateTime.now());
        teacherRepository.save(teacher);
 
        return "Registration successful!";
    }
}
