package edu.cit.spedermath.repository;

import edu.cit.spedermath.enums.LessonType;
import edu.cit.spedermath.model.StudentAttempt;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentAttemptRepository extends JpaRepository<StudentAttempt, Long> {

    List<StudentAttempt> findByStudent_StudentIDOrderByAttemptedAtDesc(Long studentId);

    List<StudentAttempt> findByStudent_StudentIDAndLesson_LessonIDOrderByAttemptedAtDesc(Long studentId, Long lessonId);

    @Query("""
        SELECT a
        FROM StudentAttempt a
        ORDER BY a.attemptedAt DESC
    """)
    List<StudentAttempt> findRecentAttempts(Long studentId, Pageable pageable);

    @Query("""
        SELECT a
        FROM StudentAttempt a
        JOIN a.lesson l
        WHERE a.student.studentID = :studentId
          AND (:type IS NULL OR l.lessonType = :type)
        ORDER BY a.attemptedAt DESC
    """)
    List<StudentAttempt> findRecentByStudentAndType(
            @Param("studentId") Long studentId,
            @Param("type") LessonType type,
            Pageable pageable
    );
}
