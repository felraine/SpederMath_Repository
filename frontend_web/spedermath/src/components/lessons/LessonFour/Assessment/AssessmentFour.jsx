// src/lessons/LessonFour/Assessment/AssessmentFour.jsx
import React, { useState, useEffect, useRef } from "react";
import NumberPlatform from "./NumberPlatform";
import StarRow from "../../../reusable/StarRow";
import { postOnce } from "../../../../utils/requestDedupe";
import { currentStudentId } from "../../../../utils/auth";

export default function AssessmentFour() {
  const [step, setStep] = useState(1); // 1=gameplay, 2=results
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(5);
  const [rawResult, setRawResult] = useState(null);
  const startedAtRef = useRef(Date.now());

  const handleFinish = async (payload) => {
    // payload: { score, total, wrongs, rounds, status, durationSec, lessonId, game }
    setRawResult(payload);
    setScore(payload?.score ?? 0);
    setTotal(payload?.total ?? payload?.rounds ?? 5);

    const timeSpent = Math.max(
      0,
      Math.round((Date.now() - startedAtRef.current) / 1000)
    );

    try {
      // identical to AssessmentOne backend pattern
      await postOnce("/api/student-progress/submit", {
        studentId: currentStudentId(),
        lessonId: 8, // your Lesson Four id
        score: payload?.score ?? 0,
        totalItems: payload?.total ?? 5,
        wrongAnswers: payload?.wrongs ?? 0,
        status: payload?.status ?? "COMPLETED",
        durationSec: timeSpent,
        game: "NumberPlatform",
      });
    } catch (err) {
      console.error("Submit failed:", err);
    }

    setStep(2);
  };

  // Star rules for 5 rounds
  const stars = score === 5 ? 3 : score >= 3 ? 2 : 1;
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
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/backgrounds/lesson_four.mp4" type="video/mp4" />
      </video>

      <div className="relative z-10 flex items-center justify-center w-full h-full p-6 text-white">
        {step === 1 && (
          <NumberPlatform
            rounds={5}
            livesPerRound={3}
            range={[1, 10]}
            lessonId={8}
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
              Your Score: {score}/{total}
            </div>

            {/* Scale 0–5 to 0–10 for stars */}
            <StarRow score={(score / total) * 10} />

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
                  setRawResult(null);
                  setScore(0);
                  setTotal(5);
                  setStep(1);
                  startedAtRef.current = Date.now();
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
}
