import React, { useState } from 'react';
import axios from 'axios';
import LessonLayout from '../reusable/LessonLayout';
import CountTutorial from "../lessons/tutorial/CountTutorial";
import { generateLessons } from '../lessons/RandomNumGen';
import { useNavigate } from 'react-router-dom';


const CountLesson = () => {
  const [showTutorial, setShowTutorial] = useState(true);
  const navigate = useNavigate();
  const [mainLessonPhase] = useState(generateLessons(10));
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

    const isCorrect = choice === current.correct;
    const nextScore = isCorrect ? score + 1 : score;

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

  const submitProgress = async () => {
    const updatedProgress = {
      score,
      status,
      unlocked,
      lesson: { lessonID: lessonId },
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

  return (
    <LessonLayout
      lesson={{ lessonid: 1, title: 'Missing Number Quest' }}
      progress={`${Math.min(currentStep + 1, mainLessonPhase.length)}/${mainLessonPhase.length}`}
    >
        {showTutorial ? (
    <CountTutorial onNext={() => setShowTutorial(false)} />
  ) : status === 'COMPLETED' || status === 'FAILED' ? (
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
          Submit Progress
        </button>
  
        {score < 7 && (
          <button
            onClick={() => {
              setScore(0);
              setCurrentStep(0);
              setStatus('IN_PROGRESS');
              setUnlocked(false);
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