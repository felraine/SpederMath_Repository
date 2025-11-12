// src/lessons/assessment/index.jsx  (Assessment 2 / NumberDrop)
import React, { useState } from "react";
import NumberDrop from "./NumberDrop";
import StarRow from "../../../reusable/StarRow";

const AssessmentIndex = () => {
  const [step, setStep] = useState(1);
  const [finalScore5, setFinalScore5] = useState(0);     // 0..5 for display
  const [finalScore10, setFinalScore10] = useState(0);   // 0..10 for StarRow

  // NumberDrop returns: { score (0..5), total (5), wrongs, rounds, status, durationSec }
  const handleFinish = (result) => {
    const raw = result?.score ?? 0;          // 0..5
    const total = result?.total ?? 5;        // should be 5 rounds
    const scaled10 =
      raw === 5 ? 10 :           // 5/5 → 10 → 3 stars
      raw >= 3 ? 7 :             // 3–4/5 → 7 → 2 stars
      Math.max(0, raw);          // 0–2 → 0–2 (still 1 star)
    setFinalScore5(raw);
    setFinalScore10(scaled10);
    setStep(2);
  };

  // Star headline rules for a 5-point max:
  // <3 -> 1 star, 3-4 -> 2 stars, 5 -> 3 stars
  const stars = finalScore5 === 5 ? 3 : finalScore5 >= 3 ? 2 : 1;

  const headline =
    stars === 3 ? "Perfect Score!" : stars === 2 ? "Great Job!" : "Nice Try!";
  const sub =
    stars === 3
      ? "You caught them all!"
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
        <source src="/backgrounds/lesson_two.mp4" type="video/mp4" />
      </video>

      {/* Overlay Content */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-6">
        {step === 1 && (
          <NumberDrop
            maxNumber={5}
            lessonId={4} // Lesson 2 - NumberDrop
            dashboardPath="/student-dashboard"
            onGameOver={handleFinish}
          />
        )}

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
            <div className="text-2xl opacity-90 mb-3">
              Your Score: {finalScore5}/5
            </div>

            {/* Keep StarRow happy by giving it a 0..10 score */}
            <StarRow score={finalScore10} />

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
                  setFinalScore5(0);
                  setFinalScore10(0);
                  setStep(1); // restart
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
