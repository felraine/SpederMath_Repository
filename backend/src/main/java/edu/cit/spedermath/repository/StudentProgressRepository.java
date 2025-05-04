package edu.cit.spedermath.repository;

import edu.cit.spedermath.model.StudentProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentProgressRepository extends JpaRepository<StudentProgress, Long> {

    List<StudentProgress> findByStudent_StudentID(Long studentId);

    Optional<StudentProgress> findByStudent_StudentIDAndLesson_LessonID(Long studentId, Long lessonId);
}