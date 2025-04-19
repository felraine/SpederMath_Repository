import React, { useState } from 'react';
import axios from 'axios';
import LessonLayout from '../reusable/LessonLayout';

const mainLessonPhase = [
    { sequence: [1, 2, 3, null, 5], correct: 4, choices: [4, 6, 7, 3] },
    { sequence: [2, 3, null, 5], correct: 4, choices: [1, 4, 6, 3] },
    { sequence: [null, 1, 2, 3], correct: 0, choices: [0, 1, 2, 3] },
    { sequence: [3, 4, null, 6], correct: 5, choices: [4, 5, 6, 7] },
    { sequence: [4, null, 6, 7], correct: 5, choices: [5, 4, 6, 3] },
    { sequence: [null, 10, 11, 12], correct: 9, choices: [9, 8, 10, 11] },
    { sequence: [5, null, 7, 8], correct: 6, choices: [6, 5, 7, 4] },
    { sequence: [8, 9, null, 11], correct: 10, choices: [10, 9, 8, 12] },
    { sequence: [null, 2, 3, 4], correct: 1, choices: [1, 0, 2, 3] },
    { sequence: [6, null, 8, 9], correct: 7, choices: [7, 6, 8, 5] },
  ];
  

const CountLesson = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('IN_PROGRESS');
  const [unlocked, setUnlocked] = useState(false);

  const lessonId = 1;
  const token = localStorage.getItem('token');
  const current = mainLessonPhase[currentStep];

  const handleChoice = (choice) => {
    if (showAnswer) return;
    setSelected(choice);
    setShowAnswer(true);

    if (choice === current.correct) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      setSelected(null);
      setShowAnswer(false);
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= mainLessonPhase.length) {
          const finalStatus = score >= 7 ? 'COMPLETED' : 'FAILED';
          setStatus(finalStatus);
          setUnlocked(score >= 7); 
          return prev;
        }
        return next;
      });
    }, 1200);
  };

  const submitProgress = async () => {
    const updatedProgress = {
      score,
      status,
      unlocked,
      lesson: { lessonID: lessonId },
    };
    try {
      await axios.post('http://localhost:8080/api/student-progress/submit', updatedProgress, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('Progress submitted successfully!');
    } catch (error) {
      console.error('Error submitting progress', error);
      alert('Failed to submit progress');
    }
  };
  console.log('token', token);

  return (
    <LessonLayout
      lesson={{ lessonid: 1, title: 'Number Explorer' }}
      progress={`${Math.min(currentStep + 1, mainLessonPhase.length)}/${mainLessonPhase.length}`}
    >
     <h2 className="text-[30px] -mt-5 mb-4 font-neucha text-left w-full">
        What is the missing number?
        </h2>


      {/* Number Line */}
      <div className="flex justify-center text-[120px] font-bold font-comicneue tracking-wider mb-6 leading-none gap-20 mt-5">
  {current.sequence.map((num, idx) => (
    <span key={idx}>
      {num === null && showAnswer ? current.correct : num ?? '_'}
    </span>
  ))}
</div>


      {/* Instruction */}
      <div className="text-[23px] font-neucha text-center mb-4 mt-15">
        CHOOSE THE CORRECT NUMBER
    </div>


      {/* Choices */}
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

      {status === 'COMPLETED' && (
  <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
    <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-xl border border-gray-300">
      <h2 className="text-[40px] font-neucha mb-4">
        {score >= 7 ? '🎉 Well done!' : '😅 Try again!'}
      </h2>

      <p className="text-xl font-neucha mb-6">
        You got {score} out of {mainLessonPhase.length} correct.
      </p>

      {/* Submit Button */}
      <button
        onClick={submitProgress}
        className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg hover:bg-green-700 transition"
      >
        Submit Progress
      </button>

      {/* Show Retake Button only if failed */}
      {score < 7 && (
        <button
          onClick={() => {
            setScore(0);
            setCurrentStep(0);
            setStatus('IN_PROGRESS');
            setUnlocked(false);
          }}
          className="ml-4 bg-yellow-400 text-black px-6 py-3 rounded-xl text-lg hover:bg-yellow-500 transition"
        >
          Retake Lesson
        </button>
      )}
    </div>
  </div>
)}




    </LessonLayout>
  );
};

export default CountLesson;
