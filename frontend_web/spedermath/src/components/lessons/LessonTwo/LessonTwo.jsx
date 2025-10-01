
import React, { useState, useMemo } from "react";
import useRandomBackground from "../../reusable/RandomBackground";

import IntroScreen from "./IntroScreen";
import TeachScreen from "./TeachScreen";
import PracticeScreen from "./PracticeScreen";
import RewardScreen from "./RewardScreen";

const LessonTwo = () => {
  // Centralized lesson metadata (display + backend)
  const lessonMeta = useMemo(
    () => ({
      lessonNumber: 2,          // display number
      title: "Numbers 1–5",     // updated title
      lessonId: 3,              // backend DB id for Lesson 1 (1–5)
      range: [1, 5],            // handy for child screens if needed
    }),
    []
  );

  const steps = useMemo(
    () => [
      (props) => <IntroScreen {...props} meta={lessonMeta} />,
      (props) => <TeachScreen {...props} meta={lessonMeta} />,
      (props) => <PracticeScreen {...props} meta={lessonMeta} />,
      (props) => <RewardScreen {...props} meta={lessonMeta} />,
    ],
    [lessonMeta]
  );

  const [index, setIndex] = useState(0);
  const totalSteps = steps.length;
  const progress = `${Math.min(index + 1, totalSteps)}/${totalSteps}`;
  const CurrentScreen = steps[index];

  // 🎨 Pick one random background at mount
  const bgImage = useRandomBackground([
    "/photos/lesson1/ocean1.jpg",
    "/photos/lesson1/ocean2.jpg",
    "/photos/lesson1/ocean3.jpg",
  ]);

  const handleBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/student-dashboard";
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden text-white"
      style={{
        "--header-h": "72px",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Top Bar + Back Button */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between p-3 sm:p-4 bg-black/40 backdrop-blur-sm z-20">
        {/* Back button (large hit area) */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 transition focus:outline-none focus:ring-2 focus:ring-white/60"
          aria-label="Go back"
        >
          <img
            src="/Back%20Button.png"
            alt=""
            className="w-7 h-7 object-contain drop-shadow"
            draggable="false"
          />
          <span className="hidden sm:inline font-semibold">Back</span>
        </button>

        {/* Title + Progress */}
        <div className="flex-1 flex items-center justify-center text-center pointer-events-none">
          <div className="font-bold text-base sm:text-lg drop-shadow">
            Lesson {lessonMeta.lessonNumber}: {lessonMeta.title}
          </div>
        </div>

        <div className="font-semibold drop-shadow">{progress}</div>
      </div>

      {/* Screen Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-6">
        <CurrentScreen
          onNext={() => setIndex((i) => Math.min(i + 1, totalSteps - 1))}
          onBack={handleBack}
          meta={lessonMeta}
        />
      </div>
    </div>
  );
};

export default LessonTwo;
