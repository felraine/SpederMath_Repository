package edu.cit.spedermath.service;

import edu.cit.spedermath.model.Lesson;
import edu.cit.spedermath.repository.LessonRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;

    public LessonService(LessonRepository lessonRepository) {
        this.lessonRepository = lessonRepository;
    }

    public List<Lesson> getAllLessons() {
        return lessonRepository.findAll();
    }

    public Optional<Lesson> getLessonById(Long id) {
        return lessonRepository.findById(id);
    }

    public Lesson createLesson(Lesson lesson) {
        return lessonRepository.save(lesson);
    }

    public Lesson updateLesson(Long id, Lesson updatedLesson) {
        return lessonRepository.findById(id)
                .map(lesson -> {
                    lesson.setTitle(updatedLesson.getTitle());
                    lesson.setDescription(updatedLesson.getDescription());
                    lesson.setLessonType(updatedLesson.getLessonType());
                    lesson.setUnlockThreshold(updatedLesson.getUnlockThreshold());
                    return lessonRepository.save(lesson);
                })
                .orElseThrow(() -> new RuntimeException("Lesson not found with id: " + id));
    }

    public void deleteLesson(Long id) {
        lessonRepository.deleteById(id);
    }
}
