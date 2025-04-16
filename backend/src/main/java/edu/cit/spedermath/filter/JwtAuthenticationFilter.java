package edu.cit.spedermath.filter;

import edu.cit.spedermath.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.lang.NonNull;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    // Override the doFilterInternal method as required by OncePerRequestFilter
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        // Allow access to Swagger UI and API docs without authentication
        // Also allow access to login and register endpoints for teachers
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs")
            || path.startsWith("/api/teachers/login") || path.startsWith("/api/teachers/register")) {
            filterChain.doFilter(request, response); // Skip token validation
            return;
        }
    
        String token = request.getHeader("Authorization");
    
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);  // Remove "Bearer " prefix
    
            try {
                Long teacherId = jwtUtil.extractTeacherId(token);
                UserDetails userDetails = new User(String.valueOf(teacherId), "", new ArrayList<>());
    
                UsernamePasswordAuthenticationToken authenticationToken = 
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
    
            } catch (Exception e) {
                logger.error("Invalid token: ", e);
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token.");
                return;
            }
        }
    
        filterChain.doFilter(request, response);
    }      
}
