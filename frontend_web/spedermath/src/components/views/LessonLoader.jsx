import React from 'react';
import { useParams } from 'react-router-dom';
import CountLesson from '../lessons/CountLesson';
import LessonNotFound from '../lessons/LessonNotFound';
import CountAnimals from '../lessons/CountAnimals';
//import AnotherLesson from './AnotherLesson'; // Example of another lesson component

const LessonLoader = () => {
  const { lessonId } = useParams();

  //add lessons here
  const lessons = {
    1: <CountLesson />,
    2:<CountAnimals />,
    // 2: <AnotherLesson />,
    // 3: <YourNextLesson />,
  };

  return lessons[lessonId] || <LessonNotFound />;
};

export default LessonLoader;
