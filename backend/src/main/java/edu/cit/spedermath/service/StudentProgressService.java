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

    // Submit completed lesson progress for a student
    public StudentProgress submitLessonProgress(StudentProgress incomingProgress, Long studentId) {
        // Check if student exists
        Student student = studentRepo.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found."));
        
        // Check if lesson exists
        Lesson lesson = lessonRepo.findById(incomingProgress.getLesson().getLessonID())
                .orElseThrow(() -> new RuntimeException("Lesson not found."));
        
        // Set up incoming progress
        incomingProgress.setStudent(student);
        incomingProgress.setLesson(lesson);
        incomingProgress.setStatus(Status.COMPLETED);
        incomingProgress.setUnlocked(true);
        incomingProgress.setLastUpdated(LocalDate.now());

        // Save and return the progress
        return progressRepo.save(incomingProgress);
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
}
