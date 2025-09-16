package edu.cit.spedermath.controller;

import edu.cit.spedermath.dto.LessonStatsDTO;
import edu.cit.spedermath.service.LessonStatsService;
import edu.cit.spedermath.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lesson-stats")
@RequiredArgsConstructor
public class LessonStatsController {

    private final JwtUtil jwtUtil;
    private final LessonStatsService lessonStatsService;

    @GetMapping
public List<LessonStatsDTO> getLessonStatsForCurrentTeacher(
        @RequestHeader("Authorization") String authHeader,
        @RequestParam(value = "type", required = false) String type // 👈 new
) {
    String token = authHeader.substring(7); 
    Long teacherId = jwtUtil.extractTeacherId(token);

    List<LessonStatsDTO> stats = lessonStatsService.getLessonStatsForTeacher(teacherId);

    if (type == null || type.isBlank()) return stats;

    try {
        return stats.stream()
                .filter(dto -> dto.getLessonType() != null 
                        && dto.getLessonType().toString().equalsIgnoreCase(type))
                .toList();
    } catch (Exception e) {
        return stats; // fallback if invalid type
    }
}
}
