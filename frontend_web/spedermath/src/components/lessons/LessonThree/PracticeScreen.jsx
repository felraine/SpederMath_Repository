// src/lessons/lesson3/PracticeScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import "../../css/overlays.css";

const PracticeScreenUnified = ({ onNext, rounds = 3 }) => {
  const [roundIndex, setRoundIndex] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState(1);
  const [selected, setSelected] = useState(null);
  const [isCounting, setIsCounting] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [showChoices, setShowChoices] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [fishSet, setFishSet] = useState([]);

  const activeAudio = useRef(null);
  const timersRef = useRef([]);
  const advanceLockRef = useRef(false);
  const countSeqIdRef = useRef(0);

  const numberAudioMap = { 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven" };

  const lesson3Audio = (f) => `/audio/lesson3/${f}`;
  const lesson1Audio = (f) => `/audio/lesson1/${f}`;

  // Try several possible filenames for the question just in case
  const QUESTION_FILES = [
    lesson3Audio("how_many_fish.mp3"),
    lesson1Audio("how_many_fish.mp3"),
    lesson3Audio("how_many_do_you_see.mp3"),
    lesson1Audio("how_many_do_you_see.mp3"),
  ];
  const LETS_COUNT_FILES = [lesson3Audio("lets_count.mp3"), lesson1Audio("lets_count.mp3")];

  const correctAudios = [lesson3Audio("correct/good_job.mp3"), lesson3Audio("correct/nice_work.mp3")];
  const correctFallbacks = [lesson1Audio("correct/good_job.mp3"), lesson1Audio("correct/nice_work.mp3")];

  const wrongAudios = [lesson3Audio("wrong/good_attempt.mp3"), lesson3Audio("wrong/nice_try.mp3")];
  const wrongFallbacks = [lesson1Audio("wrong/good_attempt.mp3"), lesson1Audio("wrong/nice_try.mp3")];

  const fishImages = ["/photos/lesson3/monkey.png"];
  const labelPlural = "monkeys";

  /* ===== Cleanup helpers ===== */
  const clearAllTimers = () => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  };
  const stopAudio = () => {
    const a = activeAudio.current;
    if (a) {
      a.onended = null;
      a.onerror = null;
      try {
        a.pause();
        a.currentTime = 0;
      } catch {}
    }
    activeAudio.current = null;
  };
  const schedule = (fn, delay) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  };
  const sleep = (ms) => new Promise((resolve) => schedule(resolve, ms));
  const cleanupRound = () => {
    clearAllTimers();
    stopAudio();
    countSeqIdRef.current++;
  };

  /* ===== Audio core ===== */
  const playTry = (src) =>
    new Promise((resolve) => {
      stopAudio();
      const a = new Audio(src);
      activeAudio.current = a;
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        a.onended = a.onerror = a.onstalled = a.onabort = null;
        resolve(ok);
      };
      a.onended = () => finish(true);
      a.onerror = a.onstalled = a.onabort = () => finish(false);
      a.play().catch(() => finish(false));
    });

  const playFirstAvailable = async (sources) => {
    for (const s of sources) {
      if (!s) continue;
      const ok = await playTry(s);
      if (ok) return true;
    }
    return false;
  };

  /* ===== Round flow ===== */
  useEffect(() => {
    startNewRound();
    return () => {
      if (activeAudio.current) {
        activeAudio.current.pause();
        activeAudio.current.currentTime = 0;
      }
    };
  
  }, [roundIndex]);

  const startNewRound = () => {
    advanceLockRef.current = false;
    cleanupRound();

    // pick 1–7 monk
    const randomCount = Math.floor(Math.random() * 7) + 1;
    const roundFish = Array.from({ length: randomCount }, () => fishImages[0]);

    setCorrectAnswer(randomCount);
    setFishSet(roundFish);
    setShuffledAnswers(shuffleArray([1, 2, 3, 4, 5, 6, 7]));
    setSelected(null);
    setIsCounting(false);
    setShowChoices(false);
    setHighlightIndex(-1);

    (async () => {
      const saidQuestion = await playFirstAvailable(QUESTION_FILES);
      if (!saidQuestion) {
        // small pause so it doesn’t feel like a skip
        await sleep(300);
      }
      await playFirstAvailable(LETS_COUNT_FILES);
      setShowChoices(true);
    })();
  };

  const shuffleArray = (arr) =>
    arr
      .map((v) => ({ v, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ v }) => v);

  /* ===== Interactions ===== */
  const safeAdvanceRound = () => {
    if (advanceLockRef.current) return;
    advanceLockRef.current = true;
    cleanupRound();
    const isLast = roundIndex >= rounds - 1;
    if (isLast) onNext?.();
    else setRoundIndex((i) => i + 1);
  };

  const handleAnswer = async (num) => {
    if (isCounting || !showChoices) return;
    setSelected(num);
    setIsCounting(true);
    const mySeq = ++countSeqIdRef.current;

    for (let i = 1; i <= num; i++) {
      if (mySeq !== countSeqIdRef.current) return;

      const word = numberAudioMap[i];
      const baseAudio = `/audio/numbers/${word}.mp3`;
      const fishAudio = `/audio/lesson3/${word}_fish.mp3`; // optional

      setHighlightIndex(i - 1);

      // For all counts except the last, play base number
      if (i < num) {
        await playFirstAvailable([baseAudio]);
      } else {
        // LAST count: prefer fish phrase; if missing, play base number (NOT both)
        const playedFishPhrase = await playFirstAvailable([fishAudio]);
        if (!playedFishPhrase) {
          await playFirstAvailable([baseAudio]);
        }
      }

      if (mySeq !== countSeqIdRef.current) return;
      await sleep(300);
    }

    // Result feedback
    if (num === correctAnswer) {
      await sleep(200);
      await playFirstAvailable([
        correctAudios[0],
        correctFallbacks[0],
        correctAudios[1],
        correctFallbacks[1],
      ]);
      await sleep(400);
      if (mySeq !== countSeqIdRef.current) return;
      safeAdvanceRound();
    } else {
      await sleep(200);
      await playFirstAvailable([
        wrongAudios[0],
        wrongFallbacks[0],
        wrongAudios[1],
        wrongFallbacks[1],
      ]);
      await sleep(350);
      if (mySeq !== countSeqIdRef.current) return;
      setIsCounting(false);
      setHighlightIndex(-1);
    }
  };

  const progressText = `${Math.min(roundIndex + 1, rounds)}/${rounds}`;

  return (
    <section className="lesson-screen">
      <div style={{ marginBottom: 10, opacity: 0.85, fontWeight: 700 }}>
        Practice {progressText}
      </div>

      <h2 style={{ fontSize: "28px", marginBottom: "20px", color: "#fff" }}>
        How many {labelPlural} do you see?
      </h2>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "30px",
          margin: "30px 0",
          flexWrap: "wrap",
        }}
      >
        {fishSet.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={labelPlural}
            style={{
              width: "100px",
              transition: "transform 0.4s ease, filter 0.4s ease",
              transform: highlightIndex === i ? "scale(1.4)" : "scale(1)",
              filter:
                highlightIndex === i
                  ? "drop-shadow(0px 0px 10px gold)"
                  : "drop-shadow(0px 0px 5px rgba(0,0,0,0.2))",
            }}
          />
        ))}
      </div>

      {showChoices && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          {shuffledAnswers.map((num) => (
            <button
              key={num}
              onClick={() => handleAnswer(num)}
              style={{
                width: "80px",
                height: "80px",
                fontSize: "28px",
                fontWeight: "bold",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.35)",
                backgroundColor:
                  selected === num
                    ? num === correctAnswer
                      ? "#4CAF50"
                      : "#F44336"
                    : "rgba(0,0,0,0.25)",
                color: "#fff",
                cursor: isCounting ? "not-allowed" : "pointer",
                boxShadow: "0 6px 12px rgba(0,0,0,0.28)",
                transition: "transform 0.2s ease, background-color 0.3s ease",
                transform: selected === num ? "scale(1.08)" : "scale(1)",
                opacity: isCounting && selected !== num ? 0.7 : 1,
              }}
              disabled={isCounting}
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default PracticeScreenUnified;
