package edu.cit.spedermath.controller;

import edu.cit.spedermath.model.Student;
import edu.cit.spedermath.service.StudentLoginTokenService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import java.util.Optional;

@Controller
public class PublicAuthController {

    @Autowired private StudentLoginTokenService tokenService;

    @Value("${app.webBaseUrl}")
    private String webBaseUrl;

    /**
     * 1) Scanner opens this with GET.
     * DO NOT validate/consume here — just pass the token to the frontend.
     * Example redirect: http://localhost:5173/student-login?token=...
     */
    @GetMapping("/public/qr-login")
    public void qrLogin(@RequestParam String token, HttpServletResponse res) throws IOException {
        res.sendRedirect(webBaseUrl + "/student-login?token=" + token);
    }

    /**
     * 2) Frontend calls this with POST to validate & consume the token ONCE.
     * Returns student info (and later, a JWT if you decide to issue one).
     */
    @PostMapping("/public/qr-exchange")
    @ResponseBody
    public ResponseEntity<?> qrExchange(@RequestParam String token) {
        Optional<Student> studentOpt = tokenService.validateAndConsume(token); // one-time + TTL
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Token invalid or expired"));
        }
        Student s = studentOpt.get();

        String fname = s.getFName();
        String lname = s.getLName();

        return ResponseEntity.ok(Map.of(
            "ok", true,
            "studentId", String.valueOf(s.getStudentID()),
            "username", s.getUsername(),
            "fname", fname == null ? "" : fname,
            "lname", lname == null ? "" : lname
        ));
    }
}
