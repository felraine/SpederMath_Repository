package edu.cit.spedermath.service;

import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.repository.TeacherRepository;
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
        teacher.setName("Test Teacher");
        teacher.setEmail("test@example.com");
        teacher.setPassword("password");
        teacher.setCreatedAt(java.time.LocalDateTime.parse("2025-03-29T00:00:00"));

        teacherRepository.save(teacher);

        return teacherRepository.findById(teacher.getId()).isPresent() ? "Connection successful!" : "Connection failed!";
    }
}
