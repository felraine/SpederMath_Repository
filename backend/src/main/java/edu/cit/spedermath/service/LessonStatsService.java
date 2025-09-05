package edu.cit.spedermath.service;

import edu.cit.spedermath.dto.LessonStatsDTO;
import java.util.List;

public interface LessonStatsService {
    List<LessonStatsDTO> getLessonStatsForTeacher(Long teacherId);
}
