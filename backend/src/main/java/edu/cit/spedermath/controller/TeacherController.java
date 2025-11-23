package edu.cit.spedermath.controller;

import edu.cit.spedermath.model.Teacher;
import edu.cit.spedermath.service.TeacherService;
import edu.cit.spedermath.util.JwtUtil;
import edu.cit.spedermath.repository.TeacherRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.http.CacheControl;

import java.util.Map;
import java.util.Optional;
import jakarta.servlet.http.HttpServletRequest;

import edu.cit.spedermath.service.GoogleAuthService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import java.util.HashMap;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    @Autowired
    private TeacherService teacherService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private GoogleAuthService googleAuthService;

    
    @PostMapping("/register")
    public ResponseEntity<String> registerTeacher(@RequestBody Map<String, String> request) {
        String fname = request.get("fname");
        String lname = request.get("lname");
        String email = request.get("email");
        String name = request.get("name"); // username
        String password = request.get("password");
        String photoBase64 = request.get("photoBase64");

        String response = teacherService.registerTeacher(fname, lname, email, name, password, photoBase64);
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

    @PostMapping("/google-login")
    public ResponseEntity<Map<String, String>> googleLogin(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        Map<String, String> response = new HashMap<>();

        if (token == null || token.isBlank()) {
            response.put("error", "Missing Google token");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        try {
            GoogleIdToken.Payload payload = googleAuthService.verify(token);
            if (payload == null) {
                response.put("error", "Invalid Google token");
                return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
            }

            String googleId = payload.getSubject();       // unique Google user id
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String givenName  = (String) payload.get("given_name");
            String familyName = (String) payload.get("family_name");

            // 1) Find or create Teacher
            Teacher teacher = teacherService.findOrCreateFromGoogle(googleId, email, name, givenName, familyName);

            // 2) Generate same kind of JWT as normal login
            String jwt = jwtUtil.generateTeacherToken(teacher.getId(), teacher.getEmail());

            response.put("token", jwt);
            response.put("message", "Google login successful");
            return new ResponseEntity<>(response, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "Google login error");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
   
    @GetMapping("/{email}")
    public ResponseEntity<?> getTeacherInfo(@PathVariable String email) {
        return teacherService.getTeacherByEmail(email)
                .<ResponseEntity<?>>map(teacher -> ResponseEntity.ok(Map.of(
                        "fname", teacher.getFname(),
                        "lname", teacher.getLname(),
                        "email", teacher.getEmail(),
                        "name", teacher.getName(),
                        "id", String.valueOf(teacher.getId()),
                        "photoUrl", "/api/teachers/" + teacher.getId() + "/photo"
                )))
                .orElseGet(() -> new ResponseEntity<>("Teacher not found!", HttpStatus.NOT_FOUND));
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
        return teacherRepository.findById(id)
                .<ResponseEntity<?>>map(teacher -> ResponseEntity.ok(Map.of(
                        "id", String.valueOf(teacher.getId()),
                        "fname", teacher.getFname(),
                        "lname", teacher.getLname(),
                        "email", teacher.getEmail(),
                        "name", teacher.getName(),
                        "photoUrl", "/api/teachers/" + teacher.getId() + "/photo"
                )))
                .orElseGet(() -> new ResponseEntity<>("Teacher not found!", HttpStatus.NOT_FOUND));
    }

    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentTeacher(HttpServletRequest request) {
        String token = jwtUtil.extractToken(request);
        if (token == null || !jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or missing token"));
        }

        Long teacherId = jwtUtil.extractTeacherId(token);
        if (teacherId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Token missing teacher id"));
        }

        return teacherRepository.findById(teacherId)
                .<ResponseEntity<?>>map(t -> ResponseEntity.ok(Map.of(
                        "id", String.valueOf(t.getId()),
                        "fname", t.getFname(),
                        "lname", t.getLname(),
                        "email", t.getEmail(),
                        "name", t.getName(),
                        "photoUrl", "/api/teachers/" + t.getId() + "/photo"
                )))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("message", "Teacher not found")));
    }

  
    @PutMapping("/me")
    public ResponseEntity<?> updateTeacherProfile(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        String token = jwtUtil.extractToken(httpRequest);
        if (token == null || !jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid or missing token"));
        }

        Long teacherId = jwtUtil.extractTeacherId(token);
        if (teacherId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid token"));
        }

        var teacherOpt = teacherRepository.findById(teacherId);
        if (teacherOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Teacher not found"));
        }

        Teacher teacher = teacherOpt.get();

        String newFname = request.get("fname");
        String newLname = request.get("lname");
        String newEmail = request.get("email");
        String newName = request.get("name");
        String photoBase64 = request.get("photoBase64"); // <--- NEW

        if (newFname != null && !newFname.trim().isEmpty()) teacher.setFname(newFname.trim());
        if (newLname != null && !newLname.trim().isEmpty()) teacher.setLname(newLname.trim());
        if (newEmail != null && !newEmail.trim().isEmpty()) teacher.setEmail(newEmail.trim());
        if (newName != null && !newName.trim().isEmpty()) teacher.setName(newName.trim());
        teacherService.updateTeacherPhoto(teacher, photoBase64);

        teacherRepository.save(teacher);

        return ResponseEntity.ok(Map.of(
                "id", String.valueOf(teacher.getId()),
                "fname", teacher.getFname(),
                "lname", teacher.getLname(),
                "email", teacher.getEmail(),
                "name", teacher.getName(),
                "photoUrl", "/api/teachers/" + teacher.getId() + "/photo",
                "message", "Profile updated successfully!"
        ));
    }

   
    @PutMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        String token = jwtUtil.extractToken(httpRequest);
        if (token == null || !jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or missing token");
        }

        Long teacherId = jwtUtil.extractTeacherId(token);
        if (teacherId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }

        Optional<Teacher> teacherOptional = teacherRepository.findById(teacherId);
        if (teacherOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Teacher not found");
        }

        Teacher teacher = teacherOptional.get();

        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");
        String confirmPassword = request.get("confirmPassword");

        if (!passwordEncoder.matches(oldPassword, teacher.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Old password is incorrect");
        }

        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("New passwords do not match");
        }

        if (passwordEncoder.matches(newPassword, teacher.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("New password cannot be same as old");
        }

        teacher.setPassword(passwordEncoder.encode(newPassword));
        teacherRepository.save(teacher);

        return ResponseEntity.ok("Password changed successfully");
    }

    @GetMapping(value = "/{id}/photo")
    public ResponseEntity<byte[]> getTeacherPhoto(@PathVariable Long id) {
        var teacherOpt = teacherRepository.findById(id);
        if (teacherOpt.isEmpty() || teacherOpt.get().getPhotoBlob() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        byte[] bytes = teacherOpt.get().getPhotoBlob();
        MediaType type = detectImageType(bytes); // <-- detect, don't assume PNG

        return ResponseEntity.ok()
                .contentType(type)
                .cacheControl(CacheControl.noCache())
                .body(bytes);
    }

    private MediaType detectImageType(byte[] b) {
        if (b != null && b.length >= 8 &&
            (b[0] & 0xFF) == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47) {
            return MediaType.IMAGE_PNG; // PNG
        }
        if (b != null && b.length >= 3 &&
            (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8) {
            return MediaType.IMAGE_JPEG; // JPEG
        }
        if (b != null && b.length >= 12 &&
            b[0] == 'R' && b[1] == 'I' && b[2] == 'F' &&
            b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return MediaType.parseMediaType("image/webp"); // WEBP
        }
        if (b != null && b.length >= 6 &&
            b[0] == 'G' && b[1] == 'I' && b[2] == 'F') {
            return MediaType.IMAGE_GIF;
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
