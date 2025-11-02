package edu.cit.spedermath.service;

import edu.cit.spedermath.enums.Status;
import edu.cit.spedermath.model.Lesson;
import edu.cit.spedermath.model.Student;
import edu.cit.spedermath.model.StudentProgress;
import edu.cit.spedermath.repository.LessonRepository;
import edu.cit.spedermath.repository.StudentProgressRepository;
import edu.cit.spedermath.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentProgressService {

    @Autowired
    private StudentProgressRepository progressRepo;

    @Autowired
    private StudentRepository studentRepo;

    @Autowired
    private LessonRepository lessonRepo;

    public List<StudentProgress> getProgressByStudent(Long studentId) {
        return progressRepo.findByStudent_StudentID(studentId);
    }

    public Optional<StudentProgress> getStudentLessonProgress(Long studentId, Long lessonId) {
        return progressRepo.findByStudent_StudentIDAndLesson_LessonID(studentId, lessonId);
    }

    @Transactional
    public StudentProgress submitLessonProgress(StudentProgress incomingProgress, Long studentId) {
        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found."));
        Lesson lesson = lessonRepo.findById(incomingProgress.getLesson().getLessonID())
                .orElseThrow(() -> new RuntimeException("Lesson not found."));

        Optional<StudentProgress> existingProgressOpt =
                progressRepo.findByStudent_StudentIDAndLesson_LessonID(studentId, lesson.getLessonID());

        StudentProgress target = existingProgressOpt.orElseGet(StudentProgress::new);
        if (target.getProgressID() == null) {
            target.setStudent(student);
            target.setLesson(lesson);
            target.setRetakesCount(0);
        }

        target.setScore(incomingProgress.getScore());
        target.setStatus(incomingProgress.getStatus());
        if (target.getStatus() == Status.FAILED) {
            target.setRetakesCount(target.getRetakesCount() + 1);
        }
        target.setUnlocked(true);
        target.setTimeSpentInSeconds(incomingProgress.getTimeSpentInSeconds());
        target.setLastUpdated(LocalDate.now());

        StudentProgress saved;
        try {
            saved = progressRepo.save(target);
        } catch (DataIntegrityViolationException e) {
            saved = progressRepo
                    .findByStudent_StudentIDAndLesson_LessonID(studentId, lesson.getLessonID())
                    .orElseThrow();
            saved.setScore(target.getScore());
            saved.setStatus(target.getStatus());
            if (saved.getStatus() == Status.FAILED) {
                saved.setRetakesCount(saved.getRetakesCount() + 1);
            }
            saved.setUnlocked(true);
            saved.setTimeSpentInSeconds(target.getTimeSpentInSeconds());
            saved.setLastUpdated(LocalDate.now());
            saved = progressRepo.save(saved);
        }

        lessonRepo.findFirstByLessonOrderGreaterThanOrderByLessonOrderAsc(lesson.getLessonOrder())
                .ifPresent(nextLesson -> {
                    if (incomingProgress.getScore() >= nextLesson.getUnlockThreshold()) {
                        Optional<StudentProgress> nextOpt =
                                progressRepo.findByStudent_StudentIDAndLesson_LessonID(studentId, nextLesson.getLessonID());
                        StudentProgress next = nextOpt.orElseGet(StudentProgress::new);
                        if (next.getProgressID() == null) {
                            next.setStudent(student);
                            next.setLesson(nextLesson);
                        }
                        boolean unlockNext = incomingProgress.getScore() >= nextLesson.getUnlockThreshold();
                        next.setUnlocked(unlockNext);
                        next.setStatus(Status.NOT_STARTED);
                        next.setLastUpdated(LocalDate.now());
                        try {
                            progressRepo.save(next);
                        } catch (DataIntegrityViolationException ex) {
                            StudentProgress latestNext = progressRepo
                                    .findByStudent_StudentIDAndLesson_LessonID(studentId, nextLesson.getLessonID())
                                    .orElseThrow();
                            latestNext.setUnlocked(unlockNext);
                            latestNext.setStatus(Status.NOT_STARTED);
                            latestNext.setLastUpdated(LocalDate.now());
                            progressRepo.save(latestNext);
                        }
                    }
                });

        return saved;
    }

    public StudentProgress savePartialProgress(StudentProgress incomingProgress, Long studentId) {
        Student student = studentRepo.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found."));
        Lesson lesson = lessonRepo.findById(incomingProgress.getLesson().getLessonID())
                .orElseThrow(() -> new RuntimeException("Lesson not found."));

        incomingProgress.setStudent(student);
        incomingProgress.setLesson(lesson);
        incomingProgress.setStatus(Status.IN_PROGRESS);
        incomingProgress.setUnlocked(false);
        incomingProgress.setLastUpdated(LocalDate.now());

        return progressRepo.save(incomingProgress);
    }

    public StudentProgress updateProgressForRetake(Long progressId, StudentProgress newProgressData, Long studentId) {
        StudentProgress existing = progressRepo.findById(progressId)
                .orElseThrow(() -> new RuntimeException("Progress not found."));
        if (!existing.getStudent().getStudentID().equals(studentId)) {
            throw new RuntimeException("Unauthorized update attempt. Progress does not belong to the logged-in student.");
        }
        existing.setScore(newProgressData.getScore());
        existing.setStatus(newProgressData.getStatus());
        existing.setUnlocked(newProgressData.isUnlocked());
        existing.setLastUpdated(LocalDate.now());
        return progressRepo.save(existing);
    }

    public void deleteProgress(Long progressId, Long studentId) {
        StudentProgress existing = progressRepo.findById(progressId)
                .orElseThrow(() -> new RuntimeException("Progress not found."));
        if (!existing.getStudent().getStudentID().equals(studentId)) {
            throw new RuntimeException("Unauthorized delete attempt. Progress does not belong to the logged-in student.");
        }
        progressRepo.deleteById(progressId);
    }

    public StudentProgress getStudentProgressById(Long progressId) {
        return progressRepo.findById(progressId)
                .orElseThrow(() -> new RuntimeException("Progress not found with ID " + progressId));
    }

    public StudentProgress updateStudentProgress(StudentProgress progress) {
        return progressRepo.save(progress);
    }
}
