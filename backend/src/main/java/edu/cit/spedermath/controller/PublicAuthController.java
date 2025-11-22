package edu.cit.spedermath.controller;

import edu.cit.spedermath.model.Student;
import edu.cit.spedermath.service.StudentLoginTokenService;
import edu.cit.spedermath.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/public")
public class PublicAuthController {

    @Autowired
    private StudentLoginTokenService tokenService;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Exchange a one-time QR token for a Student JWT (JSON response).
     * Legacy GET support:
     *   GET /public/qr-exchange?token=<uuid>
     */
    @GetMapping("/qr-exchange")
    public ResponseEntity<?> exchangeQrGet(@RequestParam("token") String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Missing token"));
        }

        Optional<Student> studentOpt = tokenService.validateAndConsume(rawToken);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Token invalid or expired"));
        }

        Student student = studentOpt.get();
        String studentJwt = jwtUtil.generateStudentToken(student.getStudentID());

        return ResponseEntity.ok(Map.of(
                "jwt", studentJwt,
                "studentId", String.valueOf(student.getStudentID()),
                "username", student.getUsername()
        ));
    }

    /**
     * New POST variant so the frontend can send JSON:
     *   POST /public/qr-exchange
     *   { "token": "<uuid>" }
     */
    @PostMapping("/qr-exchange")
    public ResponseEntity<?> exchangeQrPost(@RequestBody Map<String, String> body) {
        String rawToken = body == null ? null : body.get("token");
        if (!StringUtils.hasText(rawToken)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Missing token"));
        }

        Optional<Student> studentOpt = tokenService.validateAndConsume(rawToken);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Token invalid or expired"));
        }

        Student student = studentOpt.get();
        String studentJwt = jwtUtil.generateStudentToken(student.getStudentID());

        return ResponseEntity.ok(Map.of(
                "jwt", studentJwt,
                "studentId", String.valueOf(student.getStudentID()),
                "username", student.getUsername()
        ));
    }

    /**
     * Optional redirect-based flow for QR links (dev mode → localhost).
     *   GET /public/qr-login?token=<uuid>
     */
    @GetMapping("/qr-login")
    public ResponseEntity<?> redirectQr(@RequestParam("token") String rawToken) {
        String url = "https://spedermath.app/student-login?token=" 
                + java.net.URLEncoder.encode(rawToken, java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                .header("Location", url)
                .build();
    }
}
