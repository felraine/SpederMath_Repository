// src/lessons/assessment/index.jsx
import React, { useState } from "react";
import NumberDrop from "./NumberDrop";

const AssessmentIndex = () => {
  const [step, setStep] = useState(1);

  // store the whole payload object from NumberDrop
  const [finalResult, setFinalResult] = useState(null);

  // NumberDrop now sends: { score, total, wrongs, rounds, status, durationSec }
  const handleFinish = (result) => {
    setFinalResult(result);
    setStep(2);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/backgrounds/lesson_one.mp4" type="video/mp4" />
      </video>

      {/* Overlay Content */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-6">
        {step === 1 && (
          <NumberDrop
            maxNumber={5}
            lessonId={5}                 // <- set the correct lesson id here
            dashboardPath="/student-dashboard"
            onGameOver={handleFinish}
          />
        )}

        {step === 2 && finalResult && (
          <div className="text-center text-white">
            <h1 className="text-4xl mb-4">
              {finalResult.passed ? "Assessment Complete 🎉" : "Assessment Finished"}
            </h1>

            <p className="text-2xl mb-2">
              Your Score: {finalResult.score} / {finalResult.total}
            </p>
            <p className="opacity-90 mb-1">Status: {finalResult.status}</p>
            <p className="opacity-80">Time: {finalResult.durationSec}s</p>

            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => window.location.href = "/student-dashboard"}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-lg text-white"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => { setStep(1); setFinalResult(null); }}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 border border-white/40 rounded-lg text-lg text-white"
              >
                Restart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentIndex;
