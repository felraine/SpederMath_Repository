package edu.cit.spedermath.service;

import edu.cit.spedermath.dto.LessonStatsDTO;
import edu.cit.spedermath.repository.StudentProgressRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LessonStatsServiceImpl implements LessonStatsService {

    private final StudentProgressRepository studentProgressRepository       ;

    public LessonStatsServiceImpl(StudentProgressRepository studentProgressRepository) {
        this.studentProgressRepository = studentProgressRepository;
    }

    @Override
    public List<LessonStatsDTO> getAllLessonStats() {
        return studentProgressRepository.getLessonStatistics();
    }
}
