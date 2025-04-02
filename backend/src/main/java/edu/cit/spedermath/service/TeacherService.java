package edu.cit.spedermath.service;

import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class TeacherService {

    @Autowired
    private TeacherRepository teacherRepository;

    public String registerTeacher(String name, String email, String password) {
        if (teacherRepository.findByEmail(email.toLowerCase()).isPresent()) {
            return "Email already registered!";
        }
        Teacher teacher = new Teacher(name, email.toLowerCase(), password, LocalDateTime.now());
        teacherRepository.save(teacher);
        return "Registration successful!";
    }

    public String loginTeacher(String email, String password) {
        Optional<Teacher> teacherOptional = teacherRepository.findByEmail(email.toLowerCase());
        if (teacherOptional.isEmpty()) {
            return "Invalid email or password!";
        }
        Teacher teacher = teacherOptional.get();
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
        teacher.setPassword("password");
        teacher.setCreatedAt(LocalDateTime.now());
        teacherRepository.save(teacher);
        return teacherRepository.findById(teacher.getId()).isPresent() ?
               "Connection successful!" :
               "Connection failed!";
    }

    public Optional<Teacher> getTeacherByEmail(String email) {
        return teacherRepository.findByEmail(email.toLowerCase());
    }

    // 🔥 Forgot Password Logic
    @Transactional
    public String updatePassword(String email, String newPassword) {
        Optional<Teacher> teacherOptional = teacherRepository.findByEmail(email.toLowerCase());

        if (teacherOptional.isPresent()) {
            Teacher teacher = teacherOptional.get();
            teacher.setPassword(newPassword);
            teacherRepository.save(teacher);
            return "Password updated successfully!";
        }
        return "Teacher not found!";
    }
}
