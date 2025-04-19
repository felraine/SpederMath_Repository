package edu.cit.spedermath.repository;

import edu.cit.spedermath.model.Lesson;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    Optional<Lesson> findFirstByLessonOrderGreaterThanOrderByLessonOrderAsc(int lessonOrder);
}
