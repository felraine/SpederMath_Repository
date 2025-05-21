import React from 'react';
import { useParams } from 'react-router-dom';
import CountLesson from '../lessons/CountLesson';
import LessonNotFound from '../lessons/LessonNotFound';
import CountAnimals from '../lessons/CountAnimals';
import AddFeedMonkey from '../lessons/AddFeedMonkey';
import AddFeedMunchie from '../lessons/AddFeedMunchie';
//import AnotherLesson from './AnotherLesson'; // Example of another lesson component

const LessonLoader = () => {
  const { lessonId } = useParams();

  //add lessons here
  const lessons = {
    1: <CountLesson />,
    2:<CountAnimals />,
    3: <AddFeedMonkey />,
    4: <AddFeedMunchie />,
  };

  return lessons[lessonId] || <LessonNotFound />;
};

export default LessonLoader;
