package edu.cit.spedermath.controller;

import edu.cit.spedermath.dto.LessonStatsDTO;
import edu.cit.spedermath.service.LessonStatsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lesson-stats")
public class LessonStatsController {

    private final LessonStatsService lessonStatsService;

    public LessonStatsController(LessonStatsService lessonStatsService) {
        this.lessonStatsService = lessonStatsService;
    }

    @GetMapping
    public List<LessonStatsDTO> getLessonStats() {
        return lessonStatsService.getAllLessonStats();
    }
}
