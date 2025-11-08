// src/components/tutorial/MunchieTutorial.jsx
import React, { useState, useEffect, useRef } from "react";

const tutorialSteps = [
  { text: "Hi! I'm Munchie!", img: "/munchie/neutral_Munchie.png" },
  { text: "Drag the fruit to my mouth to feed me.", img: "/munchie/neutral_Munchie.png", animateFruit: true },
  { text: "Feed me the right number of fruits!", img: "/munchie/yum_Munchie.png" },
  { text: "If wrong, tray will turn red and I’m sad and hungry. Try again!", img: "/munchie/frown_Munchie.png" },
];

export default function MunchieTutorial({ onNext, onSkip }) {
  const [step, setStep] = useState(0);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const fruitRef = useRef(null);
  const munchieRef = useRef(null);

  /* --- detect fruit near mouth --- */
  useEffect(() => {
    if (step !== 1) return setMouthOpen(false);
    const interval = setInterval(() => {
      if (!fruitRef.current || !munchieRef.current) return;
      const f = fruitRef.current.getBoundingClientRect();
      const m = munchieRef.current.getBoundingClientRect();
      const near =
        f.left + f.width > m.left - 40 &&
        f.left < m.right + 40 &&
        f.top + f.height > m.top - 40 &&
        f.top < m.bottom + 40;
      setMouthOpen(near);
    }, 50);
    return () => clearInterval(interval);
  }, [step]);

  /* --- show modal when finished --- */
  useEffect(() => setShowReadyModal(step === tutorialSteps.length), [step]);

  const handleNext = () => setStep((s) => Math.min(s + 1, tutorialSteps.length));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center text-center overflow-hidden"
      style={{
        backgroundImage: "url('/photos/lesson3/forest7.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Top-right controls */}
      {!showReadyModal && (
        <div className="absolute top-5 right-5 flex gap-3">
          {step > 0 && step < tutorialSteps.length && (
            <button
              onClick={handlePrev}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-neucha px-6 py-2 rounded-lg shadow-md mt-16"
            >
              Previous
            </button>
          )}
          {step < tutorialSteps.length && (
            <button
              onClick={handleNext}
              className="bg-green-500 hover:bg-green-600 text-white font-neucha px-6 py-2 rounded-lg shadow-md mt-16"
            >
              Next
            </button>
          )}
          <button
            onClick={onSkip || onNext}
            className="bg-white/90 border border-gray-400 text-gray-700 font-neucha px-5 py-2 rounded-lg hover:bg-white shadow-md mt-16"
          >
            Skip Tutorial
          </button>
        </div>
      )}

      {/* Transparent centered overlay */}
      <div className="bg-white/65 backdrop-blur-sm rounded-3xl px-8 sm:px-10 py-6 shadow-lg border border-white/70 max-w-2xl w-[90%] flex flex-col items-center justify-center max-h-[90vh] overflow-hidden mt-16">
        {step < tutorialSteps.length && (
          <>
            <h2 className="text-[30px] sm:text-[34px] font-bold text-gray-800 font-neucha mb-2 drop-shadow-sm">
              Level 4: Feed Munchie Tutorial
            </h2>

            {/* Fruit animation */}
            {step === 1 && (
              <div className="relative h-24 w-24 flex flex-col items-center mb-1">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-14 w-14 rounded-xl border-2 border-dashed bg-white/90 shadow-sm flex items-center justify-center">
                  <img src="/munchie/fruit_apple.png" alt="fruit tray" className="h-9 w-9" />
                </div>
                <img
                  ref={fruitRef}
                  src="/munchie/fruit_apple.png"
                  alt="fruit moving"
                  className="absolute h-9 w-9 rounded-xl shadow-lg"
                  style={{
                    animation: "moveFruitDown 3s ease-in-out infinite",
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                />
                <svg
                  className="mt-12 animate-bounce text-yellow-400 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <style>{`
                  @keyframes moveFruitDown {
                    0% { top: 0; opacity: 1; }
                    70% { top: 70px; opacity: 1; }
                    80% { opacity: 0; }
                    81% { top: 0; opacity: 0; }
                    100% { top: 0; opacity: 1; }
                  }
                `}</style>
              </div>
            )}

            {/* Munchie visual */}
            <img
              ref={munchieRef}
              src={
                mouthOpen && step === 1
                  ? "/munchie/openmouth_Munchie.png"
                  : tutorialSteps[step].img
              }
              alt="Munchie"
              className="h-40 w-auto mb-2 select-none drop-shadow-lg"
              draggable={false}
            />

            {/* Tutorial text */}
            <p className="font-neucha text-xl sm:text-2xl text-gray-800 max-w-xl mx-auto leading-snug">
              {tutorialSteps[step].text}
            </p>
          </>
        )}
      </div>

      {/* Ready modal */}
      {showReadyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white p-10 rounded-xl shadow-md border border-black max-w-md w-full text-center">
            <img
              src="/munchie/yum_Munchie.png"
              alt="Happy Munchie"
              className="mx-auto mb-6 h-32 select-none"
              draggable={false}
            />
            <h2 className="text-[32px] mb-4 font-neucha">Yay! I'm hungry! 🍎</h2>
            <p className="text-[20px] mb-6 font-neucha">Let’s feed me some fruits!</p>
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
  );
}
