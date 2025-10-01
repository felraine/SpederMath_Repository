import React, { useState } from "react";
import AssessmentMain from "./AssessmentMain";
import NumberMaze from "./NumberMaze";

const AssessmentIndex = () => {
  const [step, setStep] = useState(1);
  const [finalScore, setFinalScore] = useState(null);

  const handleFinish = (score) => {
    setFinalScore(score);
    setStep(2); // move to results
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
        {step === 1 && <NumberMaze onFinish={handleFinish} />}
        {step === 2 && (
          <div className="text-center text-white">
            <h1 className="text-4xl mb-6">Assessment Complete 🎉</h1>
            <p className="text-2xl">Your Score: {finalScore}/10</p>
            <button
              onClick={() => (window.location.href = "/student-dashboard")}
              className="mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-lg text-white"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentIndex;
