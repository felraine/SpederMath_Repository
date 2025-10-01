import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import LessonLayout from "../../../reusable/LessonLayout";
import axios from "axios";
import Confetti from "react-confetti";
import MunchieTutorial from "../../tutorial/MunchieTutorial";


const generateAdditionLessons = (total = 10) => {
  const lessons = [];
  for (let i = 0; i < total; i++) {
    const a = Math.floor(Math.random() * 6);
    const maxB = 10 - a;
    const b = Math.floor(Math.random() * (maxB - 1)) + 1;
    const sum = a + b;
    lessons.push({ a, b, sum });
  }
  return lessons;
};

const allFruits = [
  "/munchie/fruit_apple.png",
  "/munchie/fruit_grape.png",
  "/munchie/fruit_mango.png",
  "/munchie/fruit_strawberry.png",
  "/munchie/fruit_orange.png",
  "/munchie/fruit_blueberry.png",
  "/munchie/fruit_watermelon.png",
  "/munchie/fruit_pear.png",
  "/munchie/fruit_pineapple.png",
  "/munchie/fruit_dragon.png",
];

const correctClickSound = () => new Audio("/correct-sound.mp3").play();
const incorrectClickSound = () => new Audio("/incorrect-sound.mp3").play();
const passedSound = () => new Audio("/passed-sound.mp3").play();
const failedSound = () => new Audio("/failed-sound.mp3").play();
const eatSound = () => new Audio("/munchie/munchie-eat.mp3").play();

const AddFeedMunchie = ({ lessonId, title }) => {
  const [lessons] = useState(generateAdditionLessons());
  const [currentStep, setCurrentStep] = useState(0);
  const [addedFruit, setAddedFruit] = useState(0);
  const [trayFruits, setTrayFruits] = useState(Array.from({ length: 10 }, () => true));
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState("IN_PROGRESS");

  // New states for tutorial and ready modal
  const [showTutorial, setShowTutorial] = useState(true);
  const [showReadyModal, setShowReadyModal] = useState(false);

  const [timeSpent, setTimeSpent] = useState(0);
  const [timerActive, setTimerActive] = useState(false); // controls timer start
  const [munchieFace, setMunchieFace] = useState("/munchie/neutral_Munchie.png");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  const wasDroppedRef = useRef(false);
  const munchieRef = useRef(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const current = lessons[currentStep];

  const fruitPerStep = useMemo(() => {
    return lessons.map(() => 
      allFruits.slice(0, 10)  
    );
  }, [lessons, allFruits]);


  const fruitImages = fruitPerStep[currentStep];

  // Timer effect, runs only if timerActive is true
  useEffect(() => {
    if (!timerActive) return undefined;
    const interval = setInterval(() => setTimeSpent((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    if (status === "COMPLETED") passedSound();
    else if (status === "FAILED") failedSound();
  }, [status]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
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

  // Rest of your event handlers (handleDropFruit, handleDragOverMouth, etc.)
  const handleDropFruit = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    wasDroppedRef.current = true;

    if (addedFruit < 10) {
      setAddedFruit((prev) => prev + 1);
      setMunchieFace("/munchie/muching_Munchie.png");
      eatSound();
      setTimeout(() => setMunchieFace("/munchie/neutral_Munchie.png"), 600);
    }
  };

  const handleDragOverMouth = (e) => {
    e.preventDefault();
    if (!munchieRef.current) return;

    const rect = munchieRef.current.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    const margin = 50;

    const isNearMouth =
      x >= rect.left - margin &&
      x <= rect.right + margin &&
      y >= rect.top - margin &&
      y <= rect.bottom + margin;

      setIsDraggingOver(isNearMouth);

    if (isNearMouth) {
      if (munchieFace !== "/munchie/openmouth_Munchie.png") {
        setMunchieFace("/munchie/openmouth_Munchie.png");
      }
    } else {
      if (munchieFace !== "/munchie/neutral_Munchie.png") {
        setMunchieFace("/munchie/neutral_Munchie.png");
      }
    }
  };

  const handleFeedMunchie = () => {
    const isCorrect = addedFruit === current.sum;
    const nextScore = isCorrect ? score + 1 : score;

    if (isCorrect) {
      correctClickSound();
      setShowConfetti(true);
      setShowWrong(false);
      setMunchieFace("/munchie/yum_Munchie.png");

      setTimeout(() => {
        setShowConfetti(false);
        setMunchieFace("/munchie/neutral_Munchie.png");

        if (currentStep + 1 >= lessons.length) {
          setStatus(nextScore >= 4 ? "COMPLETED" : "FAILED");
          setScore(nextScore);
          setTimerActive(false); // stop timer on finish
        } else {
          setAddedFruit(0);
          setTrayFruits(Array.from({ length: 10 }, () => true));
          setCurrentStep((prev) => prev + 1);
          setScore(nextScore);
        }
      }, 2000);
    } else {
      incorrectClickSound();
      setShowWrong(true);
      setShowConfetti(false);
      setMunchieFace("/munchie/frown_Munchie.png");

      setTimeout(() => {
        setShowWrong(false);
        setMunchieFace("/munchie/neutral_Munchie.png");

        if (currentStep + 1 >= lessons.length) {
          setStatus(nextScore >= 4 ? "COMPLETED" : "FAILED");
          setScore(nextScore);
          setTimerActive(false); // stop timer on finish
        } else {
          setAddedFruit(0);
          setTrayFruits(Array.from({ length: 10 }, () => true));
          setCurrentStep((prev) => prev + 1);
          setScore(nextScore);
        }
      }, 1500);
    }
  };

  const submitProgress = async () => {
    const progress = {
      score,
      status,
      timeSpentInSeconds: timeSpent,
      lessonId,
    };
    try {
      await axios.post("http://localhost:8080/api/student-progress/submit", progress, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Progress submitted!");
      navigate("/student-dashboard");
    } catch (error) {
      alert("Failed to submit progress");
      console.error(error);
    }
  };

  const handleDragEnd = (e) => {
    const index = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!wasDroppedRef.current) {
      requestAnimationFrame(() => {
        setTrayFruits((prev) => {
          const updated = [...prev];
          updated[index] = true;
          return updated;
        });
      });
    }
    setMunchieFace("/munchie/neutral_Munchie.png");
  };

  if (showTutorial) {
    return <MunchieTutorial onNext={onTutorialFinish} />;
  }

  if (showReadyModal) {
    return (
      <LessonLayout lesson={{ lessonid: lessonId, title: title || "Feed Munchie!" }} progress="Tutorial">
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white p-10 rounded-xl shadow-md border border-black max-w-md w-full text-center">
            <img
              src="/munchie/yum_Munchie.png"
              alt="Happy Munchie"
              className="mx-auto mb-6 h-32 select-none"
              draggable={false}
            />
            <h2 className="text-[32px] mb-4 font-neucha">Yay! I’m hungry! 🍎</h2>
            <p className="text-[20px] mb-6 font-neucha">Let’s feed me some fruits!</p>
            <button
              onClick={startLesson}
              className="bg-green-600 text-white px-6 py-3 rounded-xl text-lg hover:bg-green-700 transition"
            >
              Start
            </button>
          </div>
        </div>
      </LessonLayout>
    );
  }

  return (
    <LessonLayout
      lesson={{ lessonid: lessonId, title: title || "Feed Munchie!" }}
      progress={`${currentStep + 1}/${lessons.length}`}
      showWrong={showWrong}
      showConfetti={showConfetti}
    >
      {/* Timer */}
      <div className="absolute top-4 right-6 bg-white rounded-full px-4 py-1 text-gray-700 font-neucha text-lg shadow-md border z-50">
        Time: {formatTime(timeSpent)}
      </div>

      {/* Confetti Overlay */}
      {showConfetti && (
        <Confetti
          width={1150}
          height={500}
          recycle={true}
          numberOfPieces={100}
          gravity={0.1}
          colors={["#a3e635", "#86efac", "#bbf7d0"]}
          initialVelocityX={{ min: -2, max: 2 }}
          initialVelocityY={{ min: 5, max: 10 }}
          wind={0.01}
          style={{ pointerEvents: "none", position: "absolute", top: 0, left: 0, zIndex: 20 }}
        />
      )}

      {status !== "IN_PROGRESS" ? (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50">
          <div className="bg-[#fffaf0] rounded-3xl p-10 max-w-xl w-full text-center shadow-2xl border-4 border-[#f1f2f6]">
            <h2 className="text-[42px] font-comic font-bold text-gray-800 mb-4">
              {score >= 4 ? "Yum yum! Munchie is happy!" : "Oh no! Try again!"}
            </h2>
            <p className="text-[24px] font-neucha text-gray-700 mb-6">
              You got{" "}
              <span className="font-bold text-green-700">{score}</span> out of{" "}
              <span className="font-bold text-green-700">{lessons.length}</span>{" "}
              correct.
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
        <>
          {/* Lesson Content */}
          <div className="flex justify-between items-start px-4 sm:px-6 mt-0 mb-4">
            <h2 className="text-[20px] sm:text-[22px] font-neucha">
              Help Munchie solve: {current.a} + {current.b} = ?
            </h2>
            <div className="bg-white rounded-full px-4 py-1 text-gray-700 font-neucha text-lg shadow-md border">
              Fruits added:{" "}
              <span className={`font-bold ${addedFruit > 10 ? "text-red-600" : "text-green-700"}`}>
                {addedFruit}
              </span>
            </div>
          </div>

          {/* Fruit Tray */}
          <div className="overflow-x-auto px-4 mb-4 mt-2">
            <div className="flex justify-center">
              <div className="inline-flex gap-4">
                {trayFruits.map(
                  (hasFruit, i) =>
                    hasFruit && (
                      <div
                        key={i}
                        className="h-16 w-16 border-2 border-dashed rounded-xl flex items-center justify-center bg-white relative shrink-0"
                      >
                        <img
                          src={fruitImages[i]}
                          draggable
                          onDragStart={(e) => {
                            wasDroppedRef.current = false;

                            const dragImg = e.target.cloneNode(true);
                            dragImg.style.width = "60px";
                            dragImg.style.height = "60px";
                            dragImg.style.position = "absolute";
                            dragImg.style.top = "-1000px";
                            dragImg.style.left = "-1000px";
                            dragImg.style.pointerEvents = "none";
                            document.body.appendChild(dragImg);

                            e.dataTransfer.setDragImage(dragImg, 30, 30);
                            e.dataTransfer.setData("text/plain", i.toString());

                            setTimeout(() => {
                              setTrayFruits((prev) => {
                                const updated = [...prev];
                                updated[i] = false;
                                return updated;
                              });
                            }, 0);

                            setTimeout(() => {
                              document.body.removeChild(dragImg);
                            }, 1000);
                          }}
                          onDragEnd={(e) => {
                            const index = parseInt(e.dataTransfer.getData("text/plain"), 10);
                            if (!wasDroppedRef.current) {
                              requestAnimationFrame(() => {
                                setTrayFruits((prev) => {
                                  const updated = [...prev];
                                  updated[index] = true;
                                  return updated;
                                });
                              });
                            }
                            setMunchieFace("/munchie/neutral_Munchie.png");
                          }}
                          className="h-14 w-14 object-contain cursor-grab z-10"
                          alt="fruit"
                        />
                      </div>
                    )
                )}
              </div>
            </div>
          </div>

          {/* Munchie and Feed Button */}
          <div className="flex flex-col items-center mt-2">
            <div
              ref={munchieRef}
              className="h-52 sm:h-64 flex items-center justify-center"
              onDrop={handleDropFruit}
              onDragOver={handleDragOverMouth}
              onDragLeave={() => setMunchieFace("/munchie/neutral_Munchie.png")}
            >
              <img
                src={isDraggingOver ? "/munchie/openmouth_Munchie.png" : munchieFace}
                alt="Munchie"
                className="h-full transition-all pointer-events-none"
              />
            </div>

            <button
              onClick={handleFeedMunchie}
              className="mt-3 bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-full text-lg font-comic shadow-md"
            >
              Munchie is full!
            </button>
          </div>
        </>
      )}
    </LessonLayout>
  );
};

export default AddFeedMunchie;
