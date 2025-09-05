package edu.cit.spedermath.controller;

import edu.cit.spedermath.dto.LessonStatsDTO;
import edu.cit.spedermath.service.LessonStatsService;
import org.springframework.web.bind.annotation.*;
import edu.cit.spedermath.util.JwtUtil;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/lesson-stats")
@RequiredArgsConstructor
public class LessonStatsController {

    private final JwtUtil jwtUtil;
    private final LessonStatsService lessonStatsService;

    @GetMapping
    public List<LessonStatsDTO> getLessonStatsForCurrentTeacher(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7); // Remove "Bearer " prefix
        Long teacherId = jwtUtil.extractTeacherId(token); // Extract teacher ID from JWT

        return lessonStatsService.getLessonStatsForTeacher(teacherId); // Call service with teacher ID
    }
}

