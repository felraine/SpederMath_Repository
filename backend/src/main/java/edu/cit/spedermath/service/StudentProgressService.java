package edu.cit.spedermath.service;

import edu.cit.spedermath.enums.Status;
import edu.cit.spedermath.model.Lesson;
import edu.cit.spedermath.model.Student;
import edu.cit.spedermath.model.StudentProgress;
import edu.cit.spedermath.repository.LessonRepository;
import edu.cit.spedermath.repository.StudentProgressRepository;
import edu.cit.spedermath.repository.StudentRepository;
import edu.cit.spedermath.dto.StudentProgressDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class StudentProgressService {

    @Autowired
    private StudentProgressRepository progressRepo;

    @Autowired
    private StudentRepository studentRepo;

    @Autowired
    private LessonRepository lessonRepo;


    // Retrieve all progress records for a student
    public List<StudentProgress> getProgressByStudent(Long studentId) {
        return progressRepo.findByStudent_StudentID(studentId);
    }

    // Retrieve specific progress by student and lesson
    public Optional<StudentProgress> getStudentLessonProgress(Long studentId, Long lessonId) {
        return progressRepo.findByStudent_StudentIDAndLesson_LessonID(studentId, lessonId);
    }

    // Submit completed lesson progress for a student (Add or Update)
    public StudentProgress submitLessonProgress(StudentProgress incomingProgress, Long studentId) {
        // Find the student
        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found."));
        
        // Find the lesson
        Lesson lesson = lessonRepo.findById(incomingProgress.getLesson().getLessonID())
                .orElseThrow(() -> new RuntimeException("Lesson not found."));

        // Check if progress already exists for this student and lesson
        Optional<StudentProgress> existingProgressOpt = progressRepo.findByStudent_StudentIDAndLesson_LessonID(studentId, lesson.getLessonID());

        StudentProgress updatedProgress;
        if (existingProgressOpt.isPresent()) {
            // Update the existing progress
            StudentProgress existingProgress = existingProgressOpt.get();
            existingProgress.setScore(incomingProgress.getScore());
            existingProgress.setStatus(incomingProgress.getStatus());
            existingProgress.setUnlocked(true);
            existingProgress.setLastUpdated(LocalDate.now());
            existingProgress.setTimeSpentInSeconds(incomingProgress.getTimeSpentInSeconds());
            updatedProgress = progressRepo.save(existingProgress);
        } else {
            // No existing progress, create a new one
            incomingProgress.setStudent(student);
            incomingProgress.setLesson(lesson);
            incomingProgress.setLastUpdated(LocalDate.now());
            incomingProgress.setUnlocked(true);
            incomingProgress.setTimeSpentInSeconds(incomingProgress.getTimeSpentInSeconds()); 
            updatedProgress = progressRepo.save(incomingProgress);
        }

        // Check if next lesson needs to be unlocked
        Optional<Lesson> nextLessonOpt = lessonRepo.findFirstByLessonOrderGreaterThanOrderByLessonOrderAsc(lesson.getLessonOrder());
        if (nextLessonOpt.isPresent() && incomingProgress.getScore() >= lesson.getUnlockThreshold()) {
            Lesson nextLesson = nextLessonOpt.get();
            Optional<StudentProgress> nextProgressOpt = progressRepo.findByStudent_StudentIDAndLesson_LessonID(studentId, nextLesson.getLessonID());
            
            StudentProgress nextProgress = nextProgressOpt.orElseGet(() -> {
                StudentProgress np = new StudentProgress();
                np.setStudent(student);
                np.setLesson(nextLesson);
                return np;
            });
            
            if (incomingProgress.getScore() >= nextLesson.getUnlockThreshold()) {
                nextProgress.setUnlocked(true);
            } else {
                nextProgress.setUnlocked(false);  
            }
            nextProgress.setStatus(Status.NOT_STARTED); 
            nextProgress.setLastUpdated(LocalDate.now());
            progressRepo.save(nextProgress);
        }

        return updatedProgress;
    }       

    // Save partial progress (In-progress state)
    public StudentProgress savePartialProgress(StudentProgress incomingProgress, Long studentId) {
        // Check if student exists
        Student student = studentRepo.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found."));
        
        // Check if lesson exists
        Lesson lesson = lessonRepo.findById(incomingProgress.getLesson().getLessonID())
                .orElseThrow(() -> new RuntimeException("Lesson not found."));
        
        // Set up incoming progress for in-progress state
        incomingProgress.setStudent(student);
        incomingProgress.setLesson(lesson);
        incomingProgress.setStatus(Status.IN_PROGRESS);
        incomingProgress.setUnlocked(false);
        incomingProgress.setLastUpdated(LocalDate.now());

        // Save and return the progress
        return progressRepo.save(incomingProgress);
    }

    // Update progress if retaking the lesson
    public StudentProgress updateProgressForRetake(Long progressId, StudentProgress newProgressData, Long studentId) {
        // Fetch existing progress
        StudentProgress existing = progressRepo.findById(progressId)
                .orElseThrow(() -> new RuntimeException("Progress not found."));
        
        // Ensure the progress belongs to the correct student
        if (!existing.getStudent().getStudentID().equals(studentId)) {
            throw new RuntimeException("Unauthorized update attempt. Progress does not belong to the logged-in student.");
        }

        // Update progress details
        existing.setScore(newProgressData.getScore());
        existing.setStatus(newProgressData.getStatus());
        existing.setUnlocked(newProgressData.isUnlocked());
        existing.setLastUpdated(LocalDate.now());

        // Save and return updated progress
        return progressRepo.save(existing);
    }

    // Delete progress for a student by progress ID
    public void deleteProgress(Long progressId, Long studentId) {
        // Check if progress exists and belongs to the student
        StudentProgress existing = progressRepo.findById(progressId)
                .orElseThrow(() -> new RuntimeException("Progress not found."));

        if (!existing.getStudent().getStudentID().equals(studentId)) {
            throw new RuntimeException("Unauthorized delete attempt. Progress does not belong to the logged-in student.");
        }

        // Delete the progress
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
