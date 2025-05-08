package edu.cit.spedermath.repository;

import edu.cit.spedermath.dto.LessonStatsDTO;
import edu.cit.spedermath.model.StudentProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StudentProgressRepository extends JpaRepository<StudentProgress, Long> {

    List<StudentProgress> findByStudent_StudentID(Long studentId);
    Optional<StudentProgress> findByStudent_StudentIDAndLesson_LessonID(Long studentId, Long lessonId);

    @Query("""
        SELECT new edu.cit.spedermath.dto.LessonStatsDTO(
            sp.lesson.lessonID,
            sp.lesson.title,
            AVG(sp.score),
            AVG(sp.timeSpentInSeconds),
            SUM(sp.retakesCount),
            SUM(CASE WHEN sp.unlocked THEN 1 ELSE 0 END),
            SUM(CASE WHEN sp.unlocked = false THEN 1 ELSE 0 END),
            SUM(CASE WHEN sp.status = 'COMPLETED' THEN 1 ELSE 0 END),
            SUM(CASE WHEN sp.status = 'IN_PROGRESS' THEN 1 ELSE 0 END),
            SUM(CASE WHEN sp.status = 'NOT_STARTED' THEN 1 ELSE 0 END),
            SUM(CASE WHEN sp.status = 'FAILED' THEN 1 ELSE 0 END)
        )
        FROM StudentProgress sp
        GROUP BY sp.lesson.lessonID, sp.lesson.title
    """)
    List<LessonStatsDTO> getLessonStatistics();
}