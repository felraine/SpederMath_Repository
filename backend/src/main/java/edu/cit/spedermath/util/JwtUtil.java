package edu.cit.spedermath.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secretBase64;

    @Value("${jwt.expirationMs}")
    private long expirationMs;

    private Key signingKey() {
        // secret should be Base64-encoded; 256-bit+ recommended
        byte[] keyBytes = Decoders.BASE64.decode(secretBase64);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /* ====================== Generate ====================== */

    /** Teachers: subject=email, claims: role=TEACHER, tid */
    public String generateTeacherToken(Long teacherId, String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "TEACHER");
        claims.put("tid", teacherId); // <- Teacher ID claim used by /me
        return createToken(claims, email);
    }

    /** Students: subject=studentId (string), claims: sid + studentId (both for compatibility) */
    public String generateStudentToken(Long studentId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sid", studentId);           // preferred
        claims.put("studentId", studentId);     // backward compatibility
        // subject set to studentId so authentication.getName() can be studentId if desired
        return createToken(claims, String.valueOf(studentId));
    }

    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(signingKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /* ====================== Validate / Extract ====================== */

    /** Alias used by your filter */
    public boolean validateToken(String token) {
        return isTokenValid(token);
    }

    public boolean isTokenValid(String token) {
        try {
            getAllClaims(token); // throws if invalid/expired
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        Object role = getAllClaims(token).get("role");
        return role == null ? null : String.valueOf(role);
    }

     public Long extractTeacherId(String token) {
        try {
            Claims claims = getAllClaims(token);
            Object id = claims.get("tid");
            if (id == null) id = claims.get("teacherId");
            if (id == null) id = claims.get("id");
            return (id != null) ? Long.parseLong(id.toString()) : null;
        } catch (Exception e) {
            return null;
        }
    }

    /** Supports both "sid" and legacy "studentId" */
    public Long extractStudentId(String token) {
        Claims claims = getAllClaims(token);
        Object sid = claims.get("sid");
        if (sid == null) sid = claims.get("studentId"); // fallback
        if (sid == null) return null;
        if (sid instanceof Number) return ((Number) sid).longValue();
        return Long.parseLong(String.valueOf(sid));
    }

    /* ====================== Helpers ====================== */

    private Claims getAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(getAllClaims(token));
    }

    public String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}
