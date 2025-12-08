// src/lessons/lesson3/FeedMunchie.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import Confetti from "react-confetti";
import MunchieTutorial from "../../tutorial/MunchieTutorial";
import { postOnce } from "../../../../utils/requestDedupe";
import { currentStudentId } from "../../../../utils/auth";
import { useNavigate } from "react-router-dom";

/** NEW: counting rounds instead of addition */
const generateCountingRounds = (total = 10, maxCount = 10) => {
  const rounds = [];
  for (let i = 0; i < total; i++) {
    const n = Math.floor(Math.random() * maxCount) + 1; // 1..maxCount
    rounds.push({ target: n });
  }
  return rounds;
};

const allFruits = [
  "/munchie/fruit_apple.png",
  "/munchie/fruit_grape.png",
  "/munchie/fruit_mango.png",
  "/munchie/fruit_orange.png",
];

const correctClickSound = () => new Audio("/correct-sound.mp3").play();
const incorrectClickSound = () => new Audio("/incorrect-sound.mp3").play();
const passedSound = () => new Audio("/passed-sound.mp3").play();
const failedSound = () => new Audio("/failed-sound.mp3").play();
const eatSound = () => new Audio("/munchie/munchie-eat.mp3").play();

/**
 * Feed Munchie (Counting Version) — standalone (no LessonLayout)
 */
export default function FeedMunchieCounting({
  lessonId = 6,
  title = "Feed Munchie!",
  totalRounds = 10,
  maxCountPerRound = 7,
  passRate = 0.7,
  retakes_count = 0,
}) {
  const SAFE_MAX = Math.max(1, Math.min(7, maxCountPerRound));
  const [rounds] = useState(() => generateCountingRounds(totalRounds, SAFE_MAX));

  const [currentStep, setCurrentStep] = useState(0);
  const [addedFruit, setAddedFruit] = useState(0);
  const [trayFruits, setTrayFruits] = useState(Array.from({ length: 4 }, () => true));
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState("IN_PROGRESS");

  // Tutorial + “Ready?” modal
  const [showTutorial, setShowTutorial] = useState(true);
  const [showReadyModal, setShowReadyModal] = useState(false);

  // Timer
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Munchie state
  const [munchieFace, setMunchieFace] = useState("/munchie/neutral_Munchie.png");
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // FX
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWrong, setShowWrong] = useState(false);

  const munchieRef = useRef(null);
  const dragCloneRef = useRef(null);

  const navigate = useNavigate();
  const current = rounds[currentStep];
  const passThreshold = Math.ceil(passRate * rounds.length);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // lock a set of fruit images per round
  const fruitPerStep = useMemo(() => {
    return rounds.map(() => allFruits.slice(0, 7));
  }, [rounds]);

  const fruitImages = fruitPerStep[currentStep];

  // Timer
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => setTimeSpent((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive]);

  useEffect(() => {
    if (status === "COMPLETED") passedSound();
    else if (status === "FAILED") failedSound();
  }, [status]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Tutorial finished => show Ready Modal
  const onTutorialFinish = () => {
    setShowTutorial(false);
    setShowReadyModal(true);
  };

  // Start Lesson: close Ready modal & start timer
  const startLesson = () => {
    setShowReadyModal(false);
    setTimerActive(true);
  };

  // Munchie proximity check
  const checkProximity = (x, y) => {
    if (!munchieRef.current) return false;
    const rect = munchieRef.current.getBoundingClientRect();
    const margin = 50;
    return (
      x >= rect.left - margin &&
      x <= rect.right + margin &&
      y >= rect.top - margin &&
      y <= rect.bottom + margin
    );
  };

  // Custom drag handlers for touch & mouse
  const startDrag = (e, index) => {
    e.preventDefault();
    const fruitImg = e.target;
    const rect = fruitImg.getBoundingClientRect();
    const clone = fruitImg.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.pointerEvents = "none";
    clone.style.zIndex = 9999;
    document.body.appendChild(clone);
    dragCloneRef.current = { clone, index };

    // Prevent touch scrolling but keep scrollbar
    document.body.style.touchAction = "none";

    const moveHandler = (moveEvent) => {
      moveEvent.preventDefault(); // prevent page scroll
      let clientX, clientY;
      if (moveEvent.touches) {
        clientX = moveEvent.touches[0].clientX;
        clientY = moveEvent.touches[0].clientY;
      } else {
        clientX = moveEvent.clientX;
        clientY = moveEvent.clientY;
      }
      clone.style.left = `${clientX - rect.width / 2}px`;
      clone.style.top = `${clientY - rect.height / 2}px`;

      const nearMouth = checkProximity(clientX, clientY);
      setIsDraggingOver(nearMouth);
      setMunchieFace(nearMouth ? "/munchie/openmouth_Munchie.png" : "/munchie/neutral_Munchie.png");
    };

    const endHandler = (endEvent) => {
      let clientX, clientY;
      if (endEvent.changedTouches) {
        clientX = endEvent.changedTouches[0].clientX;
        clientY = endEvent.changedTouches[0].clientY;
      } else {
        clientX = endEvent.clientX;
        clientY = endEvent.clientY;
      }

      const nearMouth = checkProximity(clientX, clientY);
      if (nearMouth && addedFruit < 7) {
        setAddedFruit((prev) => prev + 1);
        eatSound();
      }

      clone.remove();
      dragCloneRef.current = null;
      setMunchieFace("/munchie/neutral_Munchie.png");
      setIsDraggingOver(false);

      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseup", endHandler);
      window.removeEventListener("touchmove", moveHandler);
      window.removeEventListener("touchend", endHandler);

      // Restore default touch behavior
      document.body.style.touchAction = "";
    };

    window.addEventListener("mousemove", moveHandler, { passive: false });
    window.addEventListener("mouseup", endHandler);
    window.addEventListener("touchmove", moveHandler, { passive: false });
    window.addEventListener("touchend", endHandler);
  };

  const nextStepOrFinish = (nextScore) => {
    const isLast = currentStep + 1 >= rounds.length;
    if (isLast) {
      setStatus(nextScore >= passThreshold ? "COMPLETED" : "FAILED");
      setScore(nextScore);
      setTimerActive(false);
    } else {
      setAddedFruit(0);
      setTrayFruits(Array.from({ length: 4 }, () => true));
      setCurrentStep((p) => p + 1);
      setScore(nextScore);
    }
  };

  const handleFeedMunchie = () => {
    const target = current.target;
    const isCorrect = addedFruit === target;
    const nextScore = isCorrect ? score + 1 : score;

    if (isCorrect) {
      correctClickSound();
      setShowConfetti(true);
      setShowWrong(false);
      setMunchieFace("/munchie/yum_Munchie.png");

      setTimeout(() => {
        setShowConfetti(false);
        setMunchieFace("/munchie/neutral_Munchie.png");
        nextStepOrFinish(nextScore);
      }, 1500);
    } else {
      incorrectClickSound();
      setShowWrong(true);
      setShowConfetti(false);
      setMunchieFace("/munchie/frown_Munchie.png");

      setTimeout(() => {
        setShowWrong(false);
        setMunchieFace("/munchie/neutral_Munchie.png");
        nextStepOrFinish(nextScore);
      }, 1000);
    }
  };

  const submitProgress = async () => {
    if (!lessonId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const progress = {
      lessonId,
      score,
      status,
      timeSpentInSeconds: timeSpent,
      retakes_count: retakes_count ?? 0,
    };

    try {
      const sid = currentStudentId();
      const key = `submit:${sid}:${lessonId}:${status}`;
      await postOnce(key, async () => {
        const res = await fetch(`${API_BASE}/api/student-progress/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(progress),
        });

        if (!res.ok) throw new Error(`Submit failed`);
      });

      // Removed alert/log to avoid "localhost says..." popup
      navigate("/student-dashboard");
    } catch (err) {
      console.error("Submit FAILED:", err);
    }
  };

  /* ===================== RENDER ===================== */

  if (showTutorial) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundImage: "url('/photos/lesson3/forest7.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <TopHeader
          title={title}
          progressLabel="Tutorial"
          onBack={() => navigate(-1)}
          timeLabel={formatTime(timeSpent)}
          showTimer={false}
        />
        <div className="p-4">
          <MunchieTutorial onNext={onTutorialFinish} />
        </div>
      </div>
    );
  }

  if (showReadyModal) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundImage: "url('/photos/lesson3/forest7.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <TopHeader
          title={title}
          progressLabel="Ready?"
          onBack={() => navigate(-1)}
          timeLabel={formatTime(timeSpent)}
          showTimer={false}
        />
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white p-10 rounded-xl shadow-md border border-black max-w-md w-full text-center">
            <img
              src="/munchie/yum_Munchie.png"
              alt="Happy Munchie"
              className="mx-auto mb-6 h-32 select-none"
              draggable={false}
            />
            <h2 className="text-[32px] mb-4 font-neucha">Yay! I’m hungry! 🍎</h2>
            <p className="text-[20px] mb-6 font-neucha">Feed me the right number of fruits!</p>
            <button
              onClick={startLesson}
              className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg hover:bg-green-700 transition"
            >
              Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/photos/lesson3/forest7.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <TopHeader
        title={title}
        progressLabel={`${currentStep + 1}/${rounds.length}`}
        onBack={() => navigate(-1)}
        timeLabel={formatTime(timeSpent)}
        showTimer={true}
      />

      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={true}
          numberOfPieces={100}
          gravity={0.1}
          colors={["#a3e635", "#86efac", "#bbf7d0"]}
          initialVelocityX={{ min: -2, max: 2 }}
          initialVelocityY={{ min: 5, max: 10 }}
          wind={0.01}
          style={{ pointerEvents: "none", position: "fixed", top: 0, left: 0, zIndex: 20 }}
        />
      )}

      {status !== "IN_PROGRESS" ? (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50">
          <div className="bg-[#fffaf0] rounded-3xl p-10 max-w-xl w-full text-center shadow-2xl border-4 border-[#f1f2f6]">
            <h2 className="text-[42px] font-comic font-bold text-gray-800 mb-4">
              {score >= passThreshold ? "Yum yum! Munchie is happy!" : "Oh no! Try again!"}
            </h2>
            <p className="text-[24px] font-neucha text-gray-700 mb-6">
              You got <span className="font-bold text-green-700">{score}</span> out of{" "}
              <span className="font-bold text-green-700">{rounds.length}</span> correct.
            </p>
            <button
              onClick={submitProgress}
              className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full text-lg font-comic shadow-md transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-10">
          {/* Prompt + Counter pill row */}
          <div className="flex justify-between items-start mt-2 mb-4 max-w-5xl mx-auto">
            <h2 className="text-[20px] sm:text-[22px] font-neucha bg-white/85 px-4 py-2 rounded-xl shadow border mt-20">
              Feed Munchie <b>{current.target}</b> {current.target === 1 ? "fruit" : "fruits"}!
            </h2>
            <div className="bg-white rounded-full px-4 py-1 text-gray-700 font-neucha text-lg shadow-md border mt-20">
              Fruits added:{" "}
              <span className={`font-bold ${addedFruit > current.target ? "text-red-600" : "text-green-700"}`}>
                {addedFruit}
              </span>
            </div>
          </div>

          {/* Fruit Tray */}
          <div className="overflow-x-auto px-4 mb-4 mt-2">
            <div className="flex justify-center">
              <div className="inline-flex gap-4 bg-white/70 p-3 rounded-2xl border shadow">
                {trayFruits.map(
                  (hasFruit, i) =>
                    hasFruit && (
                      <div
                        key={i}
                        className="h-16 w-16 border-2 border-dashed rounded-xl flex items-center justify-center bg-white relative shrink-0"
                      >
                        <img
                          src={fruitImages[i]}
                          className="h-14 w-14 object-contain cursor-pointer z-10"
                          alt="fruit"
                          onMouseDown={(e) => startDrag(e, i)}
                          onTouchStart={(e) => startDrag(e, i)}
                          draggable={false}
                        />
                      </div>
                    )
                )}
              </div>
            </div>
          </div>

          {/* Munchie + Action */}
          <div className="flex flex-col items-center mt-2">
            <div ref={munchieRef} className="h-52 sm:h-64 flex items-center justify-center">
              <img
                src={munchieFace}
                alt="Munchie"
                className="h-full transition-all pointer-events-none drop-shadow-lg"
              />
            </div>

            <button
              onClick={handleFeedMunchie}
              className="mt-3 bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-full text-lg font-comic shadow-md border"
            >
              Munchie is full!
            </button>

            <div className="mt-4 bg-white/85 rounded-full px-4 py-1 text-gray-800 font-neucha text-base shadow border">
              Score: <b>{score}</b> / {rounds.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Header (matches NumberMaze’s simple shell) ================= */
function TopHeader({ title, progressLabel, onBack }) {
  return (
    <div
      className="absolute top-0 left-0 w-full flex items-center justify-between p-3 sm:p-4 bg-black/40 backdrop-blur-sm z-40 text-white"
      style={{ "--header-h": "72px" }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 transition focus:outline-none focus:ring-2 focus:ring-white/60"
        aria-label="Go back"
      >
        <img
          src="/Back Button.png"
          alt=""
          className="w-7 h-7 object-contain drop-shadow"
          draggable="false"
        />
        <span className="hidden sm:inline font-semibold">Back</span>
      </button>

      <div className="flex-1 flex items-center justify-center text-center pointer-events-none">
        <div className="font-bold text-base sm:text-lg drop-shadow">{title}</div>
      </div>

      <div className="font-semibold drop-shadow">{progressLabel}</div>
    </div>
  );
}
