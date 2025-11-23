package edu.cit.spedermath.filter;

import edu.cit.spedermath.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    private static final AntPathMatcher MATCHER = new AntPathMatcher();

    private static final List<String> PUBLIC_WHITELIST = List.of(
            "/swagger-ui/**",
            "/v3/api-docs/**",
            "/api/teachers/login",
            "/api/teachers/register",
            "/api/students/student-login",
            "/api/lessons/**",
            "/api/lesson-stats",
            "/api/students/*/qr-token",
            "/public/**",
            "/error",
            "/api/summarize",
            "/api/teachers/google-login"
    );

    private boolean isPublic(String path) {
        for (String p : PUBLIC_WHITELIST) {
            if (MATCHER.match(p, path)) return true;
        }
        return false;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Preflight
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Public routes
        if (isPublic(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                if (!jwtUtil.validateToken(token)) {
                    filterChain.doFilter(request, response);
                    return;
                }

                // ===== Route-based principal extraction =====
                if (path.startsWith("/api/student-progress")) {
                    // STUDENT-ONLY area -> principal name must be pure numeric studentId
                    Long studentId = jwtUtil.extractStudentId(token);
                    if (studentId != null) {
                        UserDetails user = new User(String.valueOf(studentId), "", Collections.emptyList());
                        SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities())
                        );
                    }
                } else if (path.startsWith("/api/students")) {
                    // Accept TEACHER or STUDENT tokens here; principal name stays numeric
                    Long teacherId = jwtUtil.extractTeacherId(token);
                    if (teacherId != null) {
                        UserDetails user = new User(String.valueOf(teacherId), "", Collections.emptyList());
                        SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities())
                        );
                    } else {
                        Long studentId = jwtUtil.extractStudentId(token);
                        if (studentId != null) {
                            UserDetails user = new User(String.valueOf(studentId), "", Collections.emptyList());
                            SecurityContextHolder.getContext().setAuthentication(
                                    new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities())
                            );
                        }
                    }
                } else if (path.startsWith("/api/teachers")) {
                    // TEACHER-ONLY area -> principal name is numeric teacherId
                    Long teacherId = jwtUtil.extractTeacherId(token);
                    if (teacherId != null) {
                        UserDetails user = new User(String.valueOf(teacherId), "", Collections.emptyList());
                        SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities())
                        );
                    }
                } else if (path.startsWith("/api/attempts")) {
                    // ✅ NEW: Allow TEACHER or STUDENT to access attempts
                    Long teacherId = jwtUtil.extractTeacherId(token);
                    if (teacherId != null) {
                        UserDetails user = new User(String.valueOf(teacherId), "", Collections.emptyList());
                        SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities())
                        );
                    } else {
                        Long studentId = jwtUtil.extractStudentId(token);
                        if (studentId != null) {
                            UserDetails user = new User(String.valueOf(studentId), "", Collections.emptyList());
                            SecurityContextHolder.getContext().setAuthentication(
                                    new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities())
                            );
                        }
                    }
                }
                // ============================================

            } catch (Exception ignored) {
                // Leave context empty; protected routes will 401 via entry point.
            }
        }

        filterChain.doFilter(request, response);
    }
}
