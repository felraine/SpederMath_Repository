package edu.cit.spedermath.service;

import edu.cit.spedermath.model.Student;
import edu.cit.spedermath.model.StudentLoginToken;
import edu.cit.spedermath.repository.StudentLoginTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class StudentLoginTokenService {

    @Autowired
    private StudentLoginTokenRepository tokenRepo;

    private static final Duration TOKEN_TTL = Duration.ofMinutes(5);

    public String createTokenForStudent(Student student) {
            StudentLoginToken t = new StudentLoginToken();
            t.setToken(UUID.randomUUID().toString());
            t.setExpiresAt(Instant.now().plus(TOKEN_TTL));
            t.setUsed(false);
            t.setStudent(student);
            tokenRepo.save(t);
            return t.getToken();
        }

    public Optional<Student> validateAndConsume(String token) {
        Optional<StudentLoginToken> tokenOpt = tokenRepo.findByToken(token);
        if (tokenOpt.isEmpty()) return Optional.empty();

        StudentLoginToken loginToken = tokenOpt.get();
        boolean expired = loginToken.getExpiresAt() != null &&
                          loginToken.getExpiresAt().isBefore(Instant.now());
        if (loginToken.isUsed() || expired) return Optional.empty();

        loginToken.setUsed(true);
        tokenRepo.save(loginToken);
        return Optional.of(loginToken.getStudent());
    }
}
