package edu.cit.spedermath.controller;

import edu.cit.spedermath.dto.StudentProgressDTO;
import edu.cit.spedermath.model.Lesson;
import edu.cit.spedermath.model.Student;
import edu.cit.spedermath.model.StudentProgress;
import edu.cit.spedermath.service.StudentProgressService;
import edu.cit.spedermath.service.LessonService;
import edu.cit.spedermath.service.StudentService;
import edu.cit.spedermath.service.StudentAttemptService;
import edu.cit.spedermath.dto.AttemptHistoryDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Optional;
import java.time.LocalDate;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/student-progress")
public class StudentProgressController {

    private final StudentProgressService service;

    @Autowired
    private StudentAttemptService studentAttemptService;

    @Autowired
    private LessonService lessonService;

    @Autowired
    private StudentService studentService;

    public StudentProgressController(StudentProgressService service) {
        this.service = service;
    }

    // Endpoint to fetch all progress for the authenticated student
    @GetMapping("/my")
    public ResponseEntity<List<StudentProgressDTO>> getMyProgress(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Long studentId = Long.parseLong(authentication.getName()); // unify extraction

        List<StudentProgress> progressList = service.getProgressByStudent(studentId);

        List<StudentProgressDTO> dtoList = progressList.stream().map(p -> {
            StudentProgressDTO dto = new StudentProgressDTO();
            dto.setProgressID(p.getProgressID());
            dto.setScore(p.getScore());
            dto.setStatus(p.getStatus());
            dto.setLastUpdated(p.getLastUpdated());
            dto.setUnlocked(p.isUnlocked());
            dto.setTimeSpentInSeconds(p.getTimeSpentInSeconds());
            if (p.getLesson() != null) dto.setLessonId(p.getLesson().getLessonID());
            return dto;
        }).toList();

        return ResponseEntity.ok(dtoList.isEmpty() ? java.util.Collections.emptyList() : dtoList);
    }  

    // Endpoint to fetch progress for a specific lesson
    @GetMapping("/my/lesson/{lessonId}")
    public ResponseEntity<StudentProgress> getMyProgressForLesson(@PathVariable Long lessonId, @AuthenticationPrincipal Authentication authentication) {
        Long studentId = extractStudentIdFromAuthentication(authentication);
        return service.getStudentLessonProgress(studentId, lessonId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Endpoint to submit lesson progress (Add or Update)
    @PostMapping("/submit")
    public ResponseEntity<StudentProgress> submitLesson(@RequestBody StudentProgressDTO progressDTO,
                                                        Authentication authentication) {
        Long studentId = extractStudentIdFromAuthentication(authentication);
        
        // Create or update the StudentProgress object from the DTO
        StudentProgress incomingProgress = new StudentProgress();
        incomingProgress.setScore(progressDTO.getScore());
        incomingProgress.setStatus(progressDTO.getStatus());
        incomingProgress.setTimeSpentInSeconds(progressDTO.getTimeSpentInSeconds());
        
        // Assuming the lessonId is provided in the DTO and is used to fetch the corresponding lesson
        Optional<Lesson> lessonOpt = lessonService.getLessonById(progressDTO.getLessonId());
        if (lessonOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        Lesson lesson = lessonOpt.get();
        incomingProgress.setLesson(lesson);

        if (progressDTO.getLessonId() == null) {
            throw new IllegalArgumentException("Lesson ID must not be null");
        }
        
        // Fetch the student from the database
        Student student = studentService.getStudentById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found."));
        
        incomingProgress.setStudent(student);
        incomingProgress.setLastUpdated(LocalDate.now());
        incomingProgress.setUnlocked(true); // Set unlocked to true after submission
        
        // Save the progress in the repository
        StudentProgress savedProgress = service.submitLessonProgress(incomingProgress, studentId);

        // Log the attempt using StudentAttemptService
        studentAttemptService.logAttempt(
            student,
            lesson,
            progressDTO.getScore(),
            progressDTO.getStatus(),
            progressDTO.getTimeSpentInSeconds() != null 
                ? progressDTO.getTimeSpentInSeconds().intValue() 
                : null
        );

        return ResponseEntity.ok(savedProgress);
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

    @GetMapping("/my/lesson/{lessonId}/summary")
    public ResponseEntity<Map<String, Object>> getMyLessonSummary(
            @PathVariable Long lessonId,
            Authentication authentication
    ) {
        Long studentId = extractStudentIdFromAuthentication(authentication);

        // Current = StudentProgress → StudentProgressDTO (using your existing DTO shape)
        var progressOpt = service.getStudentLessonProgress(studentId, lessonId);
        StudentProgressDTO current = null;
        if (progressOpt.isPresent()) {
            var p = progressOpt.get();
            var dto = new StudentProgressDTO();
            dto.setProgressID(p.getProgressID());
            dto.setScore(p.getScore());
            dto.setStatus(p.getStatus());
            dto.setLastUpdated(p.getLastUpdated());
            dto.setUnlocked(p.isUnlocked());
            dto.setTimeSpentInSeconds(p.getTimeSpentInSeconds());
            if (p.getLesson() != null) dto.setLessonId(p.getLesson().getLessonID());
            current = dto;
        }

        // Previous = last StudentAttempt DTO for this lesson (already mapped by your service)
        AttemptHistoryDTO previousAttempt = studentAttemptService
                .getHistoryDTOForLesson(studentId, lessonId)
                .stream()
                .findFirst()   // list is already DESC by attemptedAt
                .orElse(null);

        Map<String, Object> body = new HashMap<>();
        body.put("current", current);
        body.put("previousAttempt", previousAttempt);

        return ResponseEntity.ok(body);
    }
}
