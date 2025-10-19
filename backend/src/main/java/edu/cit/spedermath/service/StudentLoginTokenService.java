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

    public String createTokenForStudent(Student student) {
        StudentLoginToken t = new StudentLoginToken();
        t.setToken(UUID.randomUUID().toString());
        t.setStudent(student);
        t.setUsed(false);
        t.setExpiresAt(Instant.now().plus(Duration.ofMinutes(10)));
        tokenRepo.save(t);
        return t.getToken();
    }

    public Optional<Student> validateAndConsume(String token) {
        Optional<StudentLoginToken> tokenOpt = tokenRepo.findByToken(token);
        if (tokenOpt.isEmpty()) return Optional.empty();

        StudentLoginToken loginToken = tokenOpt.get();
        if (loginToken.isUsed() || loginToken.getExpiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }

        loginToken.setUsed(true);
        tokenRepo.save(loginToken);
        return Optional.of(loginToken.getStudent());
    }
}
