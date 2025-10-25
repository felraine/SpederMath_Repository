package edu.cit.spedermath.controller;

import edu.cit.spedermath.dto.AttemptHistoryDTO;
import edu.cit.spedermath.enums.LessonType;
import edu.cit.spedermath.service.StudentAttemptService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attempts")
public class StudentAttemptController {

    private final StudentAttemptService service;

    public StudentAttemptController(StudentAttemptService service) {
        this.service = service;
    }

    @GetMapping("/{studentId}/recent")
    public ResponseEntity<List<AttemptHistoryDTO>> getRecentAttempts(
            @PathVariable Long studentId,
            @RequestParam(name = "type", required = false) LessonType type,
            @RequestParam(name = "limit", defaultValue = "40") int limit
    ) {
        List<AttemptHistoryDTO> dto = service.getRecentDTOByType(studentId, type, limit);
        return ResponseEntity.ok(dto);
    }
}
