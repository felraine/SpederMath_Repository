package edu.cit.spedermath.service;

import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.repository.TeacherRepository;
import edu.cit.spedermath.util.JwtUtil;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class TeacherService {

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public String registerTeacher(String name, String email, String password) {
        String normalizedEmail = email.toLowerCase().trim();
        if (teacherRepository.findByEmail(normalizedEmail).isPresent()) {
            return "Email already registered!";
        }
        // hash before saving
        String hashed = passwordEncoder.encode(password);
        Teacher teacher = new Teacher(name, normalizedEmail, hashed, LocalDateTime.now());
        teacherRepository.save(teacher);
        return "Registration successful!";
    }

    public Map<String, String> loginTeacher(String email, String password) {
        String normalizedEmail = email.toLowerCase().trim();
        Optional<Teacher> teacherOptional = teacherRepository.findByEmail(normalizedEmail);
        Map<String, String> response = new HashMap<>();

        if (teacherOptional.isEmpty()) {
            response.put("error", "Invalid email or password!");
            return response;
        }

        Teacher teacher = teacherOptional.get();

        // Optional: one-time migration if legacy plaintext is still stored and happens to match
        if (teacher.getPassword() != null && teacher.getPassword().equals(password)) {
            teacher.setPassword(passwordEncoder.encode(password));
            teacherRepository.save(teacher);
        }

        if (passwordEncoder.matches(password, teacher.getPassword())) {
            String token = jwtUtil.generateToken(teacher.getId());
            response.put("token", token);
            response.put("message", "Login successful!");
        } else {
            response.put("error", "Invalid email or password!");
        }
        return response;
    }

    public String testConnection() {
        Teacher t = new Teacher();
        t.setName("Test Teacher");
        t.setEmail("admin@example.com");
        t.setPassword(passwordEncoder.encode("password")); // never store plaintext
        t.setCreatedAt(LocalDateTime.now());
        teacherRepository.save(t);
        return teacherRepository.findById(t.getId()).isPresent()
                ? "Connection successful!"
                : "Connection failed!";
    }

    public Optional<Teacher> getTeacherByEmail(String email) {
        return teacherRepository.findByEmail(email.toLowerCase().trim());
    }

    @Transactional
    public String updatePassword(String email, String newPassword) {
        Optional<Teacher> opt = teacherRepository.findByEmail(email.toLowerCase().trim());
        if (opt.isPresent()) {
            Teacher t = opt.get();
            t.setPassword(passwordEncoder.encode(newPassword)); // hash new password
            teacherRepository.save(t);
            return "Password updated successfully!";
        }
        return "Teacher not found!";
    }

    public Optional<Teacher> getTeacherById(Long id) {
        return teacherRepository.findById(id);
    }
}
