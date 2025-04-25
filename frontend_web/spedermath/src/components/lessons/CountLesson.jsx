import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LessonLayout from '../reusable/LessonLayout';
import { generateLessons } from '../lessons/RandomNumGen';

const CountLesson = () => {
  const [mainLessonPhase] = useState(generateLessons(10));  // Generate 10 lesson questions
  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('IN_PROGRESS');

  const lessonId = 1;
  const token = localStorage.getItem('token');
  const current = mainLessonPhase[currentStep];

  useEffect(() => {
    if (!token) {
      alert('Please log in to continue!');
      // Optionally: redirect logic
    }
  }, [token]);

  const handleChoice = (choice) => {
    if (showAnswer) return;
    setSelected(choice);
    setShowAnswer(true);

    const isCorrect = choice === current.correct;
    const updatedScore = isCorrect ? score + 1 : score;

    setTimeout(() => {
      setSelected(null);
      setShowAnswer(false);

      if (currentStep + 1 >= mainLessonPhase.length) {
        const finalStatus = updatedScore >= 7 ? 'COMPLETED' : 'FAILED';
        setScore(updatedScore);
        setStatus(finalStatus);
      } else {
        setScore(updatedScore);
        setCurrentStep(prev => prev + 1);
      }
    }, 1200);
  };

  const submitProgress = async () => {
    const updatedProgress = {
      score,
      status,
      lesson: { lessonID: lessonId },
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
      lesson={{ lessonid: lessonId, title: 'Missing Number Quest' }}
      progress={`${Math.min(currentStep + 1, mainLessonPhase.length)}/${mainLessonPhase.length}`}
    >
      {status === 'COMPLETED' || status === 'FAILED' ? (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-xl border border-gray-300">
            <h2 className="text-[40px] font-neucha mb-4">
              {score >= 7 ? '🎉 Well done!' : '😅 Try again!'}
            </h2>
            <p className="text-xl font-neucha mb-6">
              You got {score} out of {mainLessonPhase.length} correct.
            </p>
            <button
              onClick={submitProgress}
              className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg hover:bg-green-700 transition"
            >
              Submit Progress
            </button>
            {score < 7 && (
              <button
                onClick={() => {
                  setScore(0);
                  setCurrentStep(0);
                  setStatus('IN_PROGRESS');
                }}
                className="ml-4 bg-yellow-400 text-black px-6 py-3 rounded-xl text-lg hover:bg-yellow-500 transition"
              >
                Retake Lesson
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-[30px] -mt-5 mb-4 font-neucha text-left w-full">
            What is the missing number?
          </h2>

          <div className="flex justify-center text-[120px] font-bold font-comicneue tracking-wider mb-6 leading-none gap-20 mt-5">
            {current.sequence.map((num, idx) => (
              <span key={idx}>
                {num === null && showAnswer ? current.correct : num ?? '_'}
              </span>
            ))}
          </div>

          <div className="text-[23px] font-neucha text-center mb-4 mt-15">
            CHOOSE THE CORRECT NUMBER
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-20 justify-center px-4 h-[150px] w-full max-w-[1000px] mx-auto gap-8">
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

export default CountLesson;
