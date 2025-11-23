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
import java.util.List;
import java.util.UUID;

@Service
public class TeacherService {

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private static final List<String> DEFAULT_AVATARS = List.of(
        "avatars/profile_man.png",
        "avatars/profile_man2.png",
        "avatars/profile_man3.png",
        "avatars/profile_woman.png",
        "avatars/profile_woman2.png",
        "avatars/profile_woman3.png"
    );

    private byte[] loadResourceBytes(String path) {
        try (var is = new org.springframework.core.io.ClassPathResource(path).getInputStream()) {
            return is.readAllBytes();
        } catch (Exception e) {
            return new byte[0];
        }
    }

    private byte[] randomDefaultAvatarBytes() {
        var p = DEFAULT_AVATARS.get(new java.util.Random().nextInt(DEFAULT_AVATARS.size()));
        return loadResourceBytes(p);
    }

    public String registerTeacher(String fname, String lname, String email, String name,
                                  String password, String photoBase64) {
        String normalizedEmail = email.toLowerCase().trim();

        if (teacherRepository.findByEmail(normalizedEmail).isPresent()) {
            return "Email already registered!";
        }

        String hashedPassword = passwordEncoder.encode(password);

        byte[] photoBytes;
        if (photoBase64 != null && !photoBase64.isBlank()) {
            // support plain base64 or data URL
            String b64 = photoBase64.contains(",") ? photoBase64.substring(photoBase64.indexOf(',') + 1) : photoBase64;
            photoBytes = java.util.Base64.getDecoder().decode(b64);
        } else {
            photoBytes = randomDefaultAvatarBytes();
        }

        Teacher teacher = new Teacher(fname, lname, name, normalizedEmail, hashedPassword, LocalDateTime.now());
        teacher.setPhotoBlob(photoBytes);

        teacherRepository.save(teacher);
        return "Registration successful!";
    }

    @Transactional
    public void updateTeacherPhoto(Teacher t, String photoBase64) {
        if (photoBase64 == null || photoBase64.isBlank()) return;
        String b64 = photoBase64.contains(",")
            ? photoBase64.substring(photoBase64.indexOf(',') + 1)
            : photoBase64;
        byte[] bytes = java.util.Base64.getDecoder().decode(b64);
        t.setPhotoBlob(bytes);
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

        if (teacher.getPassword() != null && teacher.getPassword().equals(password)) {
            teacher.setPassword(passwordEncoder.encode(password));
            teacherRepository.save(teacher);
        }

        if (passwordEncoder.matches(password, teacher.getPassword())) {
            String token = jwtUtil.generateTeacherToken(teacher.getId(), teacher.getEmail());
            response.put("token", token);
            response.put("message", "Login successful!");
        } else {
            response.put("error", "Invalid email or password!");
        }

        return response;
    }

    public String testConnection() {
        Teacher t = new Teacher("Test", "Teacher", "testuser", "admin@example.com", passwordEncoder.encode("password"), LocalDateTime.now());
        teacherRepository.save(t);

        return teacherRepository.findById(t.getId()).isPresent() ?
                "Connection successful!" :
                "Connection failed!";
    }

    public Optional<Teacher> getTeacherByEmail(String email) {
        return teacherRepository.findByEmail(email.toLowerCase().trim());
    }

    @Transactional
    public String updatePassword(String email, String newPassword) {
        Optional<Teacher> opt = teacherRepository.findByEmail(email.toLowerCase().trim());
        if (opt.isPresent()) {
            Teacher t = opt.get();
            t.setPassword(passwordEncoder.encode(newPassword));
            teacherRepository.save(t);
            return "Password updated successfully!";
        }
        return "Teacher not found!";
    }

    public Optional<Teacher> getTeacherById(Long id) {
        return teacherRepository.findById(id);
    }

    public Optional<Teacher> findById(Long id) {
        return teacherRepository.findById(id);
    }

    public Optional<Teacher> findByEmail(String email) {
        return teacherRepository.findByEmail(email.toLowerCase());
    }

    public Teacher findOrCreateFromGoogle(String googleId, String email, String name, String givenName, String familyName) {
        String normalizedEmail = email.toLowerCase().trim();

        // 1) If teacher exists by email, reuse it
        Optional<Teacher> existingOpt = teacherRepository.findByEmail(normalizedEmail);
        if (existingOpt.isPresent()) {
            Teacher existing = existingOpt.get();
            // Attach googleId if not set yet
            if (existing.getGoogleId() == null || existing.getGoogleId().isBlank()) {
                existing.setGoogleId(googleId);
                teacherRepository.save(existing);
            }
            return existing;
        }

        String randomRaw = "GOOGLE_" + UUID.randomUUID(); // user never sees this
        String encoded = passwordEncoder.encode(randomRaw);
    
        Teacher t = new Teacher(
                givenName,        //fname
                familyName,   //lname        
                name,          //username
                normalizedEmail, //email
                encoded,    //password
                LocalDateTime.now()
        );
        t.setGoogleId(googleId);

        // you can set a default photo or leave photoBlob null
        teacherRepository.save(t);
        return t;
    }
}
