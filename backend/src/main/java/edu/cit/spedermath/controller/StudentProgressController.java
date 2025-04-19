package edu.cit.spedermath.controller;

import edu.cit.spedermath.model.StudentProgress;
import edu.cit.spedermath.service.StudentProgressService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/student-progress")
public class StudentProgressController {

    private final StudentProgressService service;

    public StudentProgressController(StudentProgressService service) {
        this.service = service;
    }

    // Endpoint to fetch all progress for the authenticated student
    @GetMapping("/my")
public ResponseEntity<List<StudentProgress>> getMyProgress(@AuthenticationPrincipal org.springframework.security.core.userdetails.User user) {
    Long studentId = Long.parseLong(user.getUsername());  // studentId was stored as username in the filter

    List<StudentProgress> progressList = service.getProgressByStudent(studentId);

    if (progressList.isEmpty()) {
        return ResponseEntity.noContent().build();
    }

    return ResponseEntity.ok(progressList);
}


    // Endpoint to fetch progress for a specific lesson
    @GetMapping("/my/lesson/{lessonId}")
    public ResponseEntity<StudentProgress> getMyProgressForLesson(@PathVariable Long lessonId, @AuthenticationPrincipal Authentication authentication) {
        Long studentId = extractStudentIdFromAuthentication(authentication);
        return service.getStudentLessonProgress(studentId, lessonId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Endpoint to submit lesson progress
    @PostMapping("/submit")
    public ResponseEntity<StudentProgress> submitLesson(@RequestBody StudentProgress progress,
                                                        Authentication authentication) {
        Long studentId = extractStudentIdFromAuthentication(authentication);
        StudentProgress updatedProgress = service.submitLessonProgress(progress, studentId);
        return ResponseEntity.ok(updatedProgress);
    }    

    // Endpoint to save partial progress
    @PostMapping("/save")
    public ResponseEntity<StudentProgress> savePartialProgress(@RequestBody StudentProgress progress, @AuthenticationPrincipal Authentication authentication) {
        Long studentId = extractStudentIdFromAuthentication(authentication);
        StudentProgress savedProgress = service.savePartialProgress(progress, studentId);
        return ResponseEntity.ok(savedProgress);
    }

    // Endpoint to retake lesson and update progress
    @PutMapping("/{id}/retake")
    public ResponseEntity<StudentProgress> retakeLesson(@PathVariable Long id, @RequestBody StudentProgress newProgress, @AuthenticationPrincipal Authentication authentication) {
        Long studentId = extractStudentIdFromAuthentication(authentication);
        StudentProgress updatedProgress = service.updateProgressForRetake(id, newProgress, studentId);
        return ResponseEntity.ok(updatedProgress);
    }

    // Helper method to extract the student ID from the authentication principal (JWT token)
    private Long extractStudentIdFromAuthentication(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalStateException("Unauthenticated access — student ID missing!");
        }
        return Long.parseLong(authentication.getName());  // Make sure JWT holds the studentID as the 'sub' field
    }
}
