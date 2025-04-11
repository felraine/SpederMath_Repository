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
        // Get the token from the Authorization header (Bearer token)
        String token = request.getHeader("Authorization");
    
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);  // Remove the "Bearer " prefix
            
            try {
                // Validate token and extract teacher ID
                Long teacherId = jwtUtil.extractTeacherId(token);
                
                // Create authentication based on the teacher ID
                UserDetails userDetails = new User(String.valueOf(teacherId), "", new ArrayList<>());
                
                // Set authentication in the security context
                UsernamePasswordAuthenticationToken authenticationToken = 
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                
            } catch (Exception e) {
                // Log the exception (e.g., token expired or tampered)
                logger.error("Invalid token: ", e);
                
                // Send unauthorized error response
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token.");
                return;
            }
        }
    
        // Continue with the next filter in the chain
        filterChain.doFilter(request, response);
    }    
}
