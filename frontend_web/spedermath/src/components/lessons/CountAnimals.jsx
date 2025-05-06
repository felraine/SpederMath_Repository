import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LessonLayout from '../reusable/LessonLayout';
import { useNavigate } from 'react-router-dom';

const animals = ['fish', 'dog', 'sheep', 'pig'];

// Generates a random lesson with a specified number of animals and choices
const generateAnimalLesson = (total = 10) => {
  const lessons = [];

  for (let i = 0; i < total; i++) {
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const count = Math.floor(Math.random() * 7) + 2; // 2 to 8 animals
    const correct = count;
    const choices = new Set([correct]);

    while (choices.size < 4) {
      const option = Math.floor(Math.random() * 10) + 1;
      choices.add(option);
    }

    const shuffledChoices = [...choices].sort(() => 0.5 - Math.random());

    lessons.push({ animal, count, correct, choices: shuffledChoices });
  }

  return lessons;
};

// Sound effects
const correctClickSound = () => new Audio('/correct-sound.mp3').play();
const incorrectClickSound = () => new Audio('/incorrect-sound.mp3').play();
const passedSound = () => new Audio('/passed-sound.mp3').play();
const failedSound = () => new Audio('/failed-sound.mp3').play();

const CountAnimals = () => {
  const [mainLessonPhase] = useState(generateAnimalLesson(10));
  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('IN_PROGRESS');
  const [unlocked, setUnlocked] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0); // Time in seconds
  const lessonId = 2;
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const current = mainLessonPhase[currentStep];

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval); // Clean up on unmount
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Sound effects for correct and incorrect answers
  useEffect(() => {
    if (status === 'COMPLETED') {
      passedSound();
    } else if (status === 'FAILED') {
      failedSound();
    }
  }, [status]);

  const handleChoice = (choice) => {
    if (showAnswer) return;
    setSelected(choice);
    setShowAnswer(true);

    const isCorrect = choice === current.correct;
    const nextScore = isCorrect ? score + 1 : score;

    isCorrect ? correctClickSound() : incorrectClickSound();

    setTimeout(() => {
      setSelected(null);
      setShowAnswer(false);

      if (currentStep + 1 >= mainLessonPhase.length) {
        const finalStatus = nextScore >= 7 ? 'COMPLETED' : 'FAILED';
        setScore(nextScore);
        setStatus(finalStatus);
        setUnlocked(nextScore >= 7);
      } else {
        setScore(nextScore);
        setCurrentStep((prev) => prev + 1);
      }
    }, 1200);
  };

  // Submit progress to the backend
  const submitProgress = async () => {
    const updatedProgress = {
      score,
      status,
      timeSpentInSeconds: timeSpent,
      lessonId,
    };

    try {
      await axios.post('http://localhost:8080/api/student-progress/submit', updatedProgress, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Progress submitted successfully!');
      navigate('/student-dashboard');
    } catch (error) {
      console.error('Error submitting progress', error);
      alert('Failed to submit progress');
    }
  };

  const retakeProgress = async () => {
    const updatedProgress = {
      score,
      status,
      timeSpentInSeconds: timeSpent,
      lessonId,
    };

    try {
      await axios.post('http://localhost:8080/api/student-progress/submit', updatedProgress, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Progress submitted successfully!');
    } catch (error) {
      console.error('Error submitting progress:', error);
      alert('Failed to submit progress');
    }
  };

  return (
    <LessonLayout
      lesson={{ lessonid: 2, title: 'Counting Animals' }}
      progress={`${Math.min(currentStep + 1, mainLessonPhase.length)}/${mainLessonPhase.length}`}
    >
      {/* Timer Display */}
      <div className="absolute top-4 right-6 bg-white rounded-full px-4 py-1 text-gray-700 font-neucha text-lg shadow-md border">
        Time: {formatTime(timeSpent)}
      </div>

      {status === 'COMPLETED' || status === 'FAILED' ? (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50">
          <div className="bg-[#fffaf0] rounded-3xl p-10 max-w-xl w-full text-center shadow-2xl border-4 border-[#f1f2f6]">
            <h2 className="text-[42px] font-comic font-bold text-gray-800 mb-4">
              {score >= 7 ? 'Great Job!' : 'Almost There!'}
            </h2>
            <p className="text-[24px] font-neucha text-gray-700 mb-6">
              You got <span className="font-bold text-green-700">{score}</span> out of{' '}
              <span className="font-bold text-green-700">{mainLessonPhase.length}</span> correct.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={submitProgress}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full text-lg font-comic shadow-md transition"
              >
                Return to Dashboard
              </button>
              {score < 7 && (
                <button
                  onClick={() => {
                    setScore(0);
                    setCurrentStep(0);
                    setStatus('IN_PROGRESS');
                    setUnlocked(false);
                    setTimeSpent(0);
                    retakeProgress();
                  }}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-3 rounded-full text-lg font-comic shadow-md transition"
                >
                  Retake Lesson
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-[20px] mb-6 font-neucha text-left w-full">
            Count the number of animals
          </h2>

          <div className="flex justify-center flex-wrap gap-4 mb-8">
            {Array.from({ length: current.count }).map((_, index) => (
              <img
                key={index}
                src={`/${current.animal}.gif`}
                alt={current.animal}
                className="h-24 w-24"
              />
            ))}
          </div>

          <div className="text-[23px] font-neucha text-center mb-4 mt-15">
            HOW MANY ARE THERE?
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-20 justify-center px-4 h-[150px] w-full max-w-[1000px] mx-auto">
            {current.choices.map((choice, i) => {
              const isCorrect = showAnswer && choice === current.correct;
              const isWrong = showAnswer && selected === choice && choice !== current.correct;

              return (
                <button
                  key={i}
                  onClick={() => handleChoice(choice)}
                  className={`rounded-md font-comicneue text-[80px] py-3 border-2 transition
                    ${isCorrect ? 'bg-green-300 border-green-700' : ''}
                    ${isWrong ? 'bg-red-300 border-red-700' : ''}
                    ${!isCorrect && !isWrong ? 'bg-[#FFCA3A] hover:bg-yellow-400 border-black' : ''}
                  `}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </>
      )}
    </LessonLayout>
  );
};

export default CountAnimals;
