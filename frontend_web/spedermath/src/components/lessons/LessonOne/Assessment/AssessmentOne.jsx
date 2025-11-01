import React, { useState } from "react";
import NumberMaze from "./NumberMaze";
import StarRow from "../../../reusable/StarRow";

const AssessmentIndex = () => {
  const [step, setStep] = useState(1);
  const [finalScore, setFinalScore] = useState(null);

  const handleFinish = (score) => {
    setFinalScore(score ?? 0);
    setStep(2); // show results
  };

  // Star rules: <7 -> 1 star, 7-9 -> 2 stars, 10 -> 3 stars
  const stars = finalScore === 10 ? 3 : finalScore >= 7 ? 2 : 1;

  const headline =
    stars === 3 ? "Perfect Score!" : stars === 2 ? "Great Job!" : "Nice Try!";
  const sub =
    stars === 3
      ? "You found them all!"
      : stars === 2
      ? "You're almost there—keep practicing!"
      : "Good effort—let’s try again and keep improving!";

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
          <div
            className="text-center"
            style={{
              color: "white",
              background: "rgba(0,0,0,0.35)",
              borderRadius: 16,
              padding: "28px 24px",
              backdropFilter: "blur(4px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              maxWidth: 520,
              width: "92%",
            }}
          >
            <h1 className="text-4xl font-extrabold mb-2">Assessment Complete</h1>
            <div className="text-2xl opacity-90 mb-3">Your Score: {finalScore}/10</div>

            <StarRow score={finalScore} />

            <div className="mt-2 text-lg opacity-95 font-semibold">{headline}</div>
            <div className="opacity-90">{sub}</div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => (window.location.href = "/student-dashboard")}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-lg text-white font-semibold"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  // restart: go back to gameplay step
                  setFinalScore(null);
                  setStep(1);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg text-white font-semibold"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentIndex;
