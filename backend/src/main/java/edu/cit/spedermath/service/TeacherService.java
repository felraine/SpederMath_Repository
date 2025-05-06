package edu.cit.spedermath.service;

import edu.cit.spedermath.util.JwtUtil;
import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class TeacherService {

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private JwtUtil jwtUtil;

    public String registerTeacher(String name, String email, String password) {
        if (teacherRepository.findByEmail(email.toLowerCase()).isPresent()) {
            return "Email already registered!";
        }
        Teacher teacher = new Teacher(name, email.toLowerCase(), password, LocalDateTime.now());
        teacherRepository.save(teacher);
        return "Registration successful!";
    }

    public Map<String, String> loginTeacher(String email, String password) {
        Optional<Teacher> teacherOptional = teacherRepository.findByEmail(email.toLowerCase());
        Map<String, String> response = new HashMap<>();

        if (teacherOptional.isEmpty()) {
            response.put("error", "Invalid email or password!");
            return response;
        }

        Teacher teacher = teacherOptional.get();
        if (password.equals(teacher.getPassword())) {
            String token = jwtUtil.generateToken(teacher.getId());
            response.put("token", token);
            response.put("message", "Login successful!");
            return response;
        } else {
            response.put("error", "Invalid email or password!");
            return response;
        }
    }

    public String testConnection() {
        Teacher teacher = new Teacher();
        teacher.setName("Test Teacher");
        teacher.setEmail("admin@example.com");
        teacher.setPassword("password");
        teacher.setCreatedAt(LocalDateTime.now());
        teacherRepository.save(teacher);
        return teacherRepository.findById(teacher.getId()).isPresent() ? "Connection successful!" : "Connection failed!";
    }

    public Optional<Teacher> getTeacherByEmail(String email) {
        return teacherRepository.findByEmail(email.toLowerCase());
    }

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

    public Optional<Teacher> getTeacherById(Long id) {
        return teacherRepository.findById(id);
    }
}
