package edu.cit.spedermath.repository;

import edu.cit.spedermath.model.StudentLoginToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentLoginTokenRepository extends JpaRepository<StudentLoginToken, Long> {
    Optional<StudentLoginToken> findByToken(String token);
}
