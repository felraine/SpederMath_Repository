import React, { useState, useEffect, useRef } from "react";
import LessonLayout from "../../reusable/LessonLayout";

const tutorialSteps = [
  {
    text: "Hi! I'm Munchie! Ready to have some fun?",
    img: "/munchie/neutral_Munchie.png",
  },
  {
    text: "Watch the fruit fall down to my mouth!",
    img: "/munchie/neutral_Munchie.png",
    animateFruit: true,
  },
  {
    text: "Feed me the right number of fruits, please!",
    img: "/munchie/yum_Munchie.png",
  },
  {
    text: "Uh-oh! The tray turned red. Let's try feeding me the right amount again!",
    img: "/munchie/frown_Munchie.png",
    redTray: true,
  },
];

const MunchieTutorial = ({ onNext }) => {
  const [step, setStep] = useState(0);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const fruitRef = useRef(null);
  const munchieRef = useRef(null);

  // Animate mouth open if fruit near munchie mouth during fruit animation step
  useEffect(() => {
    if (step !== 1) {
      setMouthOpen(false);
      return;
    }

    const interval = setInterval(() => {
      if (!fruitRef.current || !munchieRef.current) return;

      const fruitRect = fruitRef.current.getBoundingClientRect();
      const munchieRect = munchieRef.current.getBoundingClientRect();

      const margin = 50;

      const isNear =
        fruitRect.left + fruitRect.width > munchieRect.left - margin &&
        fruitRect.left < munchieRect.right + margin &&
        fruitRect.top + fruitRect.height > munchieRect.top - margin &&
        fruitRect.top < munchieRect.bottom + margin;

      setMouthOpen(isNear);
    }, 50);

    return () => clearInterval(interval);
  }, [step]);

  // Show ready modal on finishing last tutorial step
  useEffect(() => {
    if (step === tutorialSteps.length) {
      setShowReadyModal(true);
    } else {
      setShowReadyModal(false);
    }
  }, [step]);

  const handleNext = () => {
    if (step < tutorialSteps.length) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <LessonLayout lesson={{ lessonid: 4, title: "Feed Munchie Tutorial" }} progress="Tutorial">
      <div className="flex flex-col items-center justify-center h-full text-center px-6 relative select-none">
        {/* Top Right Buttons */}
        {!showReadyModal && (
          <div className="absolute top-0 right-0 mt-4 mr-6 flex gap-4 z-10">
            {step > 0 && step < tutorialSteps.length && (
              <button
                onClick={handlePrevious}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-neucha px-6 py-2 rounded-lg shadow-md transform hover:scale-105 transition"
              >
                Previous
              </button>
            )}
            {step < tutorialSteps.length && (
              <button
                onClick={handleNext}
                className="bg-green-500 hover:bg-green-600 text-white font-neucha px-6 py-2 rounded-lg shadow-md transform hover:scale-105 transition"
              >
                Next
              </button>
            )}
            <button
              onClick={onNext}
              className="bg-white border border-black px-4 py-1 rounded-md text-sm hover:bg-gray-200 transition"
              title="Skip Tutorial"
            >
              Skip Tutorial
            </button>
          </div>
        )}

        {/* Fruit Tray & Animated Fruit (only on step 1) */}
        {step === 1 && (
          <div className="relative h-32 w-32 -mb-4 flex flex-col items-center">
            {/* Static Fruit Tray */}
            <div
              className={`absolute top-0 left-1/2 transform -translate-x-1/2 h-16 w-16 rounded-xl border-2 border-dashed bg-white shadow-sm flex items-center justify-center
                ${tutorialSteps[step].redTray ? "border-red-600 bg-red-100 shadow-[0_0_15px_5px_rgba(220,38,38,0.75)]" : ""}
              `}
            >
              <img src="/munchie/fruit_apple.png" alt="fruit tray" className="h-10 w-10" />
            </div>

            {/* Animated fruit moving down */}
            <img
              ref={fruitRef}
              src="/munchie/fruit_apple.png"
              alt="fruit moving"
              className="absolute h-10 w-10 rounded-xl shadow-lg"
              style={{
                animation: "moveFruitDown 3s ease-in-out infinite",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />

            {/* Bouncing Down Arrow */}
            <svg
              className="mt-16 animate-bounce text-yellow-400 w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>

            <style>{`
              @keyframes moveFruitDown {
                0% {
                  top: 0;
                  opacity: 1;
                }
                70% {
                  top: 90px;
                  opacity: 1;
                }
                80% {
                  opacity: 0;
                }
                81% {
                  top: 0;
                  opacity: 0;
                }
                100% {
                  top: 0;
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        )}

        {/* Munchie Image */}
        {step < tutorialSteps.length && (
          <img
            ref={munchieRef}
            src={mouthOpen && step === 1 ? "/munchie/openmouth_Munchie.png" : tutorialSteps[step].img}
            alt="Munchie"
            className="h-48 w-auto mb-6 select-none drop-shadow-lg"
            draggable={false}
          />
        )}

        {/* Instruction Text */}
        {step < tutorialSteps.length && (
          <p className="font-neucha text-3xl max-w-xl mx-auto mb-6 px-4 select-none leading-snug text-yellow-700 drop-shadow-md">
            {tutorialSteps[step].text}
          </p>
        )}

        {/* Ready Modal */}
        {showReadyModal && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 px-6">
            <div className="bg-white p-10 rounded-xl shadow-md border border-black max-w-md w-full text-center">
              <img
                src="/munchie/yum_Munchie.png"
                alt="Happy Munchie"
                className="mx-auto mb-6 h-32 select-none"
                draggable={false}
              />
              <h2 className="text-[32px] mb-4 font-neucha">Yay! I'm hungry! 🍎</h2>
              <p className="text-[20px] mb-6 font-neucha">
                Let’s feed me some fruits!
              </p>
              <button
                onClick={onNext}
                className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg hover:bg-green-700 transition"
              >
                Start
              </button>
            </div>
          </div>
        )}
      </div>
    </LessonLayout>
  );
};

export default MunchieTutorial;
