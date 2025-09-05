package edu.cit.spedermath.service;

import edu.cit.spedermath.dto.LessonStatsDTO;
import edu.cit.spedermath.repository.StudentProgressRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LessonStatsServiceImpl implements LessonStatsService {

    private final StudentProgressRepository studentProgressRepository;

    @Override
    public List<LessonStatsDTO> getLessonStatsForTeacher(Long teacherId) {
        return studentProgressRepository.getLessonStatisticsByTeacherId(teacherId);
    }
}
