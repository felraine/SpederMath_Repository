package edu.cit.spedermath.repository;

import edu.cit.spedermath.model.Student;
import edu.cit.spedermath.model.Teacher;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUsername(String username);
    boolean existsByPassword(String password);
    List<Student> findByTeacher(Teacher teacher);
}
