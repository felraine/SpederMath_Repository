package edu.cit.spedermath.service;

import edu.cit.spedermath.dto.AttemptHistoryDTO;
import edu.cit.spedermath.enums.LessonType;
import edu.cit.spedermath.enums.Status;
import edu.cit.spedermath.model.Lesson;
import edu.cit.spedermath.model.Student;
import edu.cit.spedermath.model.StudentAttempt;
import edu.cit.spedermath.repository.StudentAttemptRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class StudentAttemptService {

    private final StudentAttemptRepository attemptRepo;

    public StudentAttemptService(StudentAttemptRepository attemptRepo) {
        this.attemptRepo = attemptRepo;
    }

    /** Called whenever an assessment is submitted (alongside StudentProgress). */
    public StudentAttempt logAttempt(Student student, Lesson lesson, Integer score,
                                     Status status, Integer timeSpentSeconds) {
        StudentAttempt a = new StudentAttempt();
        a.setStudent(student);
        a.setLesson(lesson);
        a.setScore(score);
        a.setStatus(status);
        a.setTimeSpentSeconds(timeSpentSeconds);
        a.setAttemptedAt(LocalDateTime.now());
        return attemptRepo.save(a);
    }

    /** Full history for a student across all lessons (newest first). */
    public List<StudentAttempt> getHistory(Long studentId) {
        return attemptRepo.findByStudent_StudentIDOrderByAttemptedAtDesc(studentId);
    }

    /** History for a student for a specific lesson (newest first). */
    public List<StudentAttempt> getHistoryForLesson(Long studentId, Long lessonId) {
        return attemptRepo.findByStudent_StudentIDAndLesson_LessonIDOrderByAttemptedAtDesc(studentId, lessonId);
    }

    /** Recent N attempts across all lessons (unfiltered). */
    public List<StudentAttempt> getRecent(Long studentId, int limit) {
        return attemptRepo.findRecentAttempts(studentId, PageRequest.of(0, Math.max(1, limit)));
    }

    /** ✅ Recent N attempts filtered by LessonType (e.g., only ASSESSMENT). */
    public List<StudentAttempt> getRecentByType(Long studentId, LessonType type, int limit) {
        return attemptRepo.findRecentByStudentAndType(
                studentId,
                type,
                PageRequest.of(0, Math.max(1, limit))
        );
    }

    /** Map history-for-lesson to DTO (with lessonType + lessonOrder). */
    public List<AttemptHistoryDTO> getHistoryDTOForLesson(Long studentId, Long lessonId) {
        return getHistoryForLesson(studentId, lessonId).stream()
                .map(a -> new AttemptHistoryDTO(
                        a.getAttemptId(),
                        a.getLesson().getLessonID(),
                        a.getLesson().getTitle(),
                        a.getScore(),
                        a.getStatus() != null ? a.getStatus().name() : null,
                        a.getTimeSpentSeconds(),
                        a.getAttemptedAt(),
                        a.getLesson().getLessonType(),
                        a.getLesson().getLessonOrder(),
                        a.getLesson().getMax_score()
                ))
                .toList();
    }

    /** Map recent attempts to DTO (unfiltered, includes lessonOrder). */
    public List<AttemptHistoryDTO> getRecentDTO(Long studentId, int limit) {
        return getRecent(studentId, limit).stream()
                .map(a -> new AttemptHistoryDTO(
                        a.getAttemptId(),
                        a.getLesson().getLessonID(),
                        a.getLesson().getTitle(),
                        a.getScore(),
                        a.getStatus() != null ? a.getStatus().name() : null,
                        a.getTimeSpentSeconds(),
                        a.getAttemptedAt(),
                        a.getLesson().getLessonType(),
                        a.getLesson().getLessonOrder(),
                        a.getLesson().getMax_score()
                ))
                .toList();
    }

    /** ✅ Map filtered attempts (by LessonType) to DTO (includes lessonOrder). */
    public List<AttemptHistoryDTO> getRecentDTOByType(Long studentId, LessonType type, int limit) {
        return getRecentByType(studentId, type, limit).stream()
                .map(a -> new AttemptHistoryDTO(
                        a.getAttemptId(),
                        a.getLesson().getLessonID(),
                        a.getLesson().getTitle(),
                        a.getScore(),
                        a.getStatus() != null ? a.getStatus().name() : null,
                        a.getTimeSpentSeconds(),
                        a.getAttemptedAt(),
                        a.getLesson().getLessonType(),
                        a.getLesson().getLessonOrder(),
                        a.getLesson().getMax_score()
                ))
                .toList();
    }
}
