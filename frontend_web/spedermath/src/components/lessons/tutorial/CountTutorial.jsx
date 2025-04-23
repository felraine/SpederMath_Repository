import React, { useState, useEffect } from 'react';

const tutorialSteps = [
  {
    type: 'intro',
    sequence: [1, 2, null, 4],
    correct: 3,
    explanation:
      'Let’s learn how to find a missing number in a counting pattern. Numbers usually go up by one. Let’s find the number that fits best.',
  },
  {
    type: 'animated',
    sequence: [4, 5, null, 7, 8],
    correct: 6,
    choices: [3, 6, 9, 10],
  },
  {
    type: 'animated',
    sequence: [10, 11, null, 13, 14],
    correct: 12,
    choices: [12, 15, 9, 11],
  },
];

const CountTutorial = ({ onNext, studentName = 'Student' }) => {
  const [step, setStep] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [readyToStart, setReadyToStart] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const current = tutorialSteps[step];

  useEffect(() => {
    // Delay to show intro screen
    const introTimer = setTimeout(() => {
      setShowIntro(false);
    }, 5000); // 3-second intro

    return () => clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    if (readyToStart || showIntro) return;

    if (current.type === 'animated') {
      const correctIndex = current.choices.findIndex(
        (choice) => choice === current.correct
      );

      const loop = setInterval(() => {
        setHighlightIndex(correctIndex);
        setTimeout(() => setHighlightIndex(null), 800);
      }, 1800);

      const showBtn = setTimeout(() => setShowNext(true), 4000);

      return () => {
        clearInterval(loop);
        clearTimeout(showBtn);
      };
    } else {
      const timer = setTimeout(() => setStep(step + 1), 5000);
      return () => clearTimeout(timer);
    }
  }, [step, readyToStart, showIntro]);

  const handleNext = () => {
    if (step + 1 >= tutorialSteps.length) {
      setReadyToStart(true);
    } else {
      setShowNext(false);
      setStep(step + 1);
    }
  };

  // ✅ Custom Intro Screen
  if (showIntro) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#fffaf0] font-neucha">
        <div className="text-center">
          <img
            src="/mascot.png"
            alt="Mascot"
            className="w-32 h-32 mx-auto mb-4 animate-wave"
          />
          
  
          <h2 className="text-[36px] text-gray-800 mb-2">
            Hi {studentName}!
          </h2>
          <p className="text-[22px] text-gray-700 mb-6">
            Get ready to start your counting tutorial.
          </p>
  
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  

  return (
    <div className="w-full h-full text-center font-neucha px-4 relative">
      {/* Top Right Buttons */}
      {!readyToStart && (
        <div className="absolute top-0 right-0 mt-4 mr-6 flex gap-4 z-10">
          {showNext && (
            <button
              onClick={handleNext}
              className="bg-[#FFCA3A] border-black border-2 px-4 py-1 rounded-md text-sm hover:bg-yellow-400 transition"
            >
              Next
            </button>
          )}
          <button
            onClick={onNext}
            className="bg-white border border-black px-4 py-1 rounded-md text-sm hover:bg-gray-200 transition"
          >
            Skip Tutorial
          </button>
        </div>
      )}

      <h2 className="text-[30px] -mt-5 mb-4 font-neucha text-left w-full">
        What is the missing number?
      </h2>

      {/* Number Sequence */}
      <div className="flex justify-center text-[120px] font-comicneue font-bold tracking-wider mb-6 leading-none gap-20">
        {current.sequence.map((num, idx) => (
          <span key={idx} className={num === null ? 'text-green-700' : ''}>
            {num === null && current.type === 'intro'
              ? current.correct
              : num === null
              ? '_'
              : num}
          </span>
        ))}
      </div>

      {/* Instruction */}
      <div className="text-[23px] text-center mb-8 max-w-3xl mx-auto">
        {current.type === 'intro'
          ? current.explanation
          : 'Watch and learn which number fits in the blank.'}
      </div>

      {/* Choices */}
      {current.type === 'animated' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 justify-center px-4 h-[150px] w-full max-w-[1000px] mx-auto">
          {current.choices.map((choice, i) => {
            const isCorrect = choice === current.correct;
            const isHighlighted = i === highlightIndex;

            return (
              <button
                key={i}
                disabled
                className={`rounded-xl font-comicneue text-[80px] py-3 border-2 transition duration-300
                  ${isCorrect && isHighlighted ? 'bg-[#A0D8B3] border-green-700 scale-105' : ''}
                  ${
                    !isCorrect
                      ? 'bg-gray-200 border-black cursor-not-allowed'
                      : isHighlighted
                      ? ''
                      : 'bg-green-100 border-green-600'
                  }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      )}

      {/* Final Modal */}
      {readyToStart && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-10 rounded-xl shadow-md border border-black max-w-md w-full text-center">
            <h2 className="text-[32px] mb-4 font-neucha">You're ready!</h2>
            <p className="text-[20px] mb-6 font-neucha">Let’s begin the lesson now.</p>
            <button
              onClick={onNext}
              className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg hover:bg-green-700 transition"
            >
              Start the Lesson
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountTutorial;
