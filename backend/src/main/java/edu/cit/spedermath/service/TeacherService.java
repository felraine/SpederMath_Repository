package edu.cit.spedermath.service;

import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.repository.TeacherRepository;
import edu.cit.spedermath.util.JwtUtil;
import edu.cit.spedermath.service.EmailService;
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

    @Autowired
    private EmailService emailService;

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

        Optional<Teacher> existingOpt = teacherRepository.findByEmail(normalizedEmail);
        Teacher teacher;

        if (existingOpt.isPresent()) {
            teacher = existingOpt.get();

            // If already verified, we block re-registration
            if (teacher.isEmailVerified()) {
                return "Email already registered!";
            }

            // Allow updating pending (unverified) registration
            teacher.setFname(fname);
            teacher.setLname(lname);
            teacher.setName(name);
            teacher.setPassword(passwordEncoder.encode(password));
        } else {
            String hashedPassword = passwordEncoder.encode(password);

            teacher = new Teacher(fname, lname, name, normalizedEmail, hashedPassword, LocalDateTime.now());
        }

        // Photo
        byte[] photoBytes;
        if (photoBase64 != null && !photoBase64.isBlank()) {
            String b64 = photoBase64.contains(",")
                    ? photoBase64.substring(photoBase64.indexOf(',') + 1)
                    : photoBase64;
            photoBytes = java.util.Base64.getDecoder().decode(b64);
        } else {
            photoBytes = randomDefaultAvatarBytes();
        }
        teacher.setPhotoBlob(photoBytes);

        // Mark as not verified, generate code
        String code = generateVerificationCode();
        teacher.setEmailVerified(false);
        teacher.setVerificationCode(code);
        teacher.setVerificationCodeCreatedAt(LocalDateTime.now());

        teacherRepository.save(teacher);

        // Send code to email
        emailService.sendVerificationCode(normalizedEmail, code);

        return "Verification code sent to your email!";
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
            response.put("error", "Invalid email or password.");
            return response;
        }

        Teacher teacher = teacherOptional.get();

        if (!teacher.isEmailVerified()) {
            response.put("error", "Please verify your email before logging in.");
            return response;
        }

        if (!passwordEncoder.matches(password, teacher.getPassword())) {
            response.put("error", "Invalid email or password.");
            return response;
        }

        String token = jwtUtil.generateTeacherToken(teacher.getId(), teacher.getEmail());
        response.put("token", token);
        response.put("message", "Login successful!");
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
            boolean changed = false;

            if (existing.getGoogleId() == null || existing.getGoogleId().isBlank()) {
                existing.setGoogleId(googleId);
                changed = true;
            }

            if (!existing.isEmailVerified()) {
                existing.setEmailVerified(true);
                existing.setVerificationCode(null);
                existing.setVerificationCodeCreatedAt(null);
                changed = true;
            }

            if (changed) {
                existing = teacherRepository.save(existing);
            }

            return existing;
        }

        // 2) Otherwise, create a new teacher from Google info
        String randomRaw = "GOOGLE_" + UUID.randomUUID(); 
        String encoded = passwordEncoder.encode(randomRaw);

        Teacher t = new Teacher(
                givenName,        // fname
                familyName,       // lname
                name,             // username 
                normalizedEmail, // email
                encoded,         
                LocalDateTime.now()
        );

        t.setGoogleId(googleId);
        t.setEmailVerified(true);             
        t.setVerificationCode(null);
        t.setVerificationCodeCreatedAt(null);

        return teacherRepository.save(t);
    }

    private String generateVerificationCode() {
        int n = java.util.concurrent.ThreadLocalRandom.current()
                .nextInt(0, 1_000_000);
        return String.format("%06d", n);
    }

    public Map<String, String> verifyEmailCode(String email, String code) {
        Map<String, String> response = new HashMap<>();
        String normalizedEmail = email.toLowerCase().trim();

        Optional<Teacher> opt = teacherRepository.findByEmail(normalizedEmail);
        if (opt.isEmpty()) {
            response.put("error", "No pending registration found for this email.");
            return response;
        }

        Teacher teacher = opt.get();

        if (teacher.isEmailVerified()) {
            response.put("message", "Email already verified.");
            return response;
        }

        String storedCode = teacher.getVerificationCode();
        if (storedCode == null || !storedCode.equals(code)) {
            response.put("error", "Invalid verification code.");
            return response;
        }

        // Optional: code expiry (15 mins)
        LocalDateTime createdAt = teacher.getVerificationCodeCreatedAt();
        if (createdAt != null && createdAt.isBefore(LocalDateTime.now().minusMinutes(15))) {
            response.put("error", "Verification code has expired. Please request a new one.");
            return response;
        }

        teacher.setEmailVerified(true);
        teacher.setVerificationCode(null);
        teacher.setVerificationCodeCreatedAt(null);
        teacherRepository.save(teacher);

        response.put("message", "Email verified successfully. You can now log in.");
        return response;
    }
}
