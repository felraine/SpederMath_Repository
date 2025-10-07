// src/lessons/lesson2/AssessmentMain.jsx
import React, { useEffect, useState, useRef } from "react";

const numberAudioMap = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
};

const correctAudios = [
  "/audio/lesson2/correct/good_job.mp3",
  "/audio/lesson2/correct/nice_work.mp3",
];

const wrongAudios = [
  "/audio/lesson2/wrong/good_attempt.mp3",
  "/audio/lesson2/wrong/nice_try.mp3",
];

const MAX_N = 10;
const TOTAL_QUESTIONS = 10;

export default function AssessmentMain({ onFinish }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState(1);
  const [selected, setSelected] = useState(null);
  const [isCounting, setIsCounting] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showChoices, setShowChoices] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);
  const [score, setScore] = useState(0);

  const activeAudio = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    startNewRound();
    return () => {
      mountedRef.current = false;
      if (activeAudio.current) {
        activeAudio.current.pause?.();
        activeAudio.current.currentTime = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex]);

  const shuffleArray = (array) =>
    array
      .map((v) => ({ v, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ v }) => v);

  const playRandomAudio = (list, cb) => {
    const f = list[Math.floor(Math.random() * list.length)];
    const a = new Audio(f);
    activeAudio.current = a;
    a.play().catch(() => {});
    if (cb) a.onended = cb;
  };

  const startNewRound = () => {
    const randomCount = Math.floor(Math.random() * MAX_N) + 1;

    setCorrectAnswer(randomCount);
    setShuffledAnswers(
      shuffleArray(Array.from({ length: MAX_N }, (_, i) => i + 1))
    );
    setSelected(null);
    setIsCounting(false);
    setHighlightIndex(-1);
    setShowChoices(false);

    // Generic prompt (replace with your actual file)
    const qAudio = new Audio("/audio/lesson2/how_many_objects.mp3");
    activeAudio.current = qAudio;
    qAudio.onended = () => setShowChoices(true);
    qAudio.onerror = () => setShowChoices(true);
    qAudio.play().catch(() => setShowChoices(true));
  };

  const handleAnswer = (num) => {
    if (isCounting) return;
    setSelected(num);
    setIsCounting(true);
    let i = 1;

    const playNext = () => {
      if (!mountedRef.current) return;
      if (i <= correctAnswer) {
        const word = numberAudioMap[i];
        const clip = new Audio(`/audio/lesson2/${word}.mp3`);
        activeAudio.current = clip;

        setHighlightIndex(i - 1);

        clip.play().catch(() => {});
        clip.onended = () => {
          i++;
          playNext();
        };
        clip.onerror = () => {
          i++;
          playNext();
        };
      } else {
        setTimeout(() => {
          if (num === correctAnswer) {
            setScore((s) => s + 1);
            playRandomAudio(correctAudios, nextQuestion);
          } else {
            playRandomAudio(wrongAudios, nextQuestion);
          }
        }, 400);
      }
    };

    playNext();
  };

  const nextQuestion = () => {
    setIsCounting(false);
    setHighlightIndex(-1);
    if (questionIndex < TOTAL_QUESTIONS - 1) {
      setQuestionIndex((q) => q + 1);
    } else {
      onFinish?.(score);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen text-white flex flex-col items-center justify-start p-6">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 transition px-2 py-2"
      >
        <img src="/Back%20Button.png" alt="Back" className="w-10 h-10" />
      </button>

      {/* HUD */}
      <div className="mt-2 mb-6 inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 backdrop-blur shadow">
        <span className="font-bold">
          🧠 Question {questionIndex + 1}/{TOTAL_QUESTIONS}
        </span>
        <span className="h-5 w-px bg-white/40" />
        <span className="font-bold">⭐ Score: {score}</span>
      </div>

      {/* Title */}
      <h2 className="text-3xl sm:text-4xl font-extrabold mb-5 text-center">
        Count the objects!
      </h2>

      {/* Objects row */}
      <div className="flex flex-wrap justify-center gap-8 my-6">
        {[...Array(correctAnswer)].map((_, i) => (
          <div
            key={i}
            className={[
              "w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-3xl",
              "transition-transform duration-300 shadow-[0_6px_14px_rgba(0,0,0,0.25)]",
              highlightIndex === i ? "scale-125 ring-4 ring-yellow-300/70" : "scale-100",
            ].join(" ")}
            aria-hidden="true"
          >
            {/* simple neutral token */}
            ⚪
          </div>
        ))}
      </div>

      {/* Choices */}
      {showChoices && (
        <>
          <div className="mt-2 mb-4 text-2xl font-bold text-center">
            How many objects?
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-[680px]">
            {shuffledAnswers.map((n) => {
              const isSelected = selected === n;
              const isCorrect = isSelected && n === correctAnswer;

              return (
                <button
                  key={n}
                  onClick={() => !isCounting && handleAnswer(n)}
                  disabled={isCounting}
                  className={[
                    "w-24 h-24 rounded-2xl border text-3xl font-extrabold",
                    "transition-all shadow-[0_6px_12px_rgba(0,0,0,0.28)]",
                    "border-white/30",
                    isSelected
                      ? isCorrect
                        ? "bg-green-600"
                        : "bg-rose-600"
                      : "bg-white/15 hover:bg-white/25",
                    isCounting ? "cursor-not-allowed opacity-90" : "cursor-pointer",
                  ].join(" ")}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
