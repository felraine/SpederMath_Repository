// src/lessons/LessonFour/Assessment/AssessmentFour.jsx
import React, { useState } from "react";
import NumberPlatform from "./NumberPlatform";

export default function AssessmentFour() {
  const [result, setResult] = useState(null);

  const handleFinish = (payload) => {
    // payload = { score, total, wrongs, rounds, status, durationSec, lessonId, game }
    setResult(payload);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* optional background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/backgrounds/lesson_four.mp4" type="video/mp4" />
      </video>

      <div className="relative z-10 w-full h-full flex items-center justify-center p-6 text-white">
        {!result && (
          <NumberPlatform
            rounds={5}                 // adjust as you want
            livesPerRound={3}          // “3 lives before a wrong point”
            range={[1, 10]}            // Lesson 4 range
            lessonId={/* put your DB id for lesson 1–10 here, e.g. */ 8}
            onGameOver={handleFinish}
          />
        )}

        {result && (
          <div className="text-center">
            <h1 className="text-4xl font-extrabold mb-3">
              {result.status === "PASSED" ? "Assessment Complete 🎉" : "Assessment Finished"}
            </h1>
            <p className="text-2xl mb-1">Points (reached 10): {result.score} / {result.total}</p>
            <p className="mb-1">Wrongs (ran out of lives): {result.wrongs}</p>
            <p className="opacity-90">Time: {result.durationSec}s</p>

            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => window.location.href = "/student-dashboard"}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-lg text-white"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => setResult(null)}
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
}