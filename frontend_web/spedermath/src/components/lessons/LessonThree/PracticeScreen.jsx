// src/lessons/lesson3/PracticeScreen.jsx
import React, { useEffect, useState, useRef } from "react";
import "../../css/overlays.css";

const PracticeScreenUnified = ({ onNext, rounds = 3, meta }) => {
  const [roundIndex, setRoundIndex] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState(1);
  const [selected, setSelected] = useState(null);
  const [isCounting, setIsCounting] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState([1, 2, 3, 4, 5, 6, 7]); // 1–7
  const [showChoices, setShowChoices] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [fishSet, setFishSet] = useState([]); // randomized fish images per round
  const activeAudio = useRef(null);

  // ---- assets ----
  const numberAudioMap = { 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven" };

  // Try lesson3 audio, fallback to lesson1
  const lesson3Audio = (f) => `/audio/lesson3/${f}`;
  const lesson1Audio = (f) => `/audio/lesson1/${f}`;

  const questionAudioPrimary = lesson3Audio("how_many_fish.mp3");
  const questionAudioFallback = lesson1Audio("how_many_fish.mp3");

  const letsCountPrimary = lesson3Audio("lets_count.mp3");
  const letsCountFallback = lesson1Audio("lets_count.mp3");

  const correctAudios = [
    lesson3Audio("correct/good_job.mp3"),
    lesson3Audio("correct/nice_work.mp3"),
  ];
  const correctFallbacks = [
    lesson1Audio("correct/good_job.mp3"),
    lesson1Audio("correct/nice_work.mp3"),
  ];

  const wrongAudios = [
    lesson3Audio("wrong/good_attempt.mp3"),
    lesson3Audio("wrong/nice_try.mp3"),
  ];
  const wrongFallbacks = [
    lesson1Audio("wrong/good_attempt.mp3"),
    lesson1Audio("wrong/nice_try.mp3"),
  ];

  // images (reuse lesson3 monkey sprites)
  const fishImages = [
    "/photos/lesson3/monkey.png",
  ];

  const labelPlural = "monkies";

  const shuffleArray = (array) =>
    array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

  const playOneWithFallback = (primaryFile, fallbackFile, cb) => {
    const a = new Audio(primaryFile);
    activeAudio.current = a;
    a.play().catch(() => {});
    a.onended = cb || null;
    a.onerror = () => {
      const b = new Audio(fallbackFile);
      activeAudio.current = b;
      b.onended = cb || null;
      b.onerror = cb || null;
      b.play().catch(() => {});
    };
  };

  const playRandomAudio = (audioList, fallbackList, callback) => {
    const idx = Math.floor(Math.random() * audioList.length);
    const primary = audioList[idx];
    const fallback = fallbackList[idx] || fallbackList[0];
    playOneWithFallback(primary, fallback, callback);
  };

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
    // pick 1–7 monk
    const randomCount = Math.floor(Math.random() * 7) + 1;

    const roundFish = Array.from({ length: randomCount }, () => {
      const idx = Math.floor(Math.random() * fishImages.length);
      return fishImages[idx];
    });

    setCorrectAnswer(randomCount);
    setFishSet(roundFish);
    setShuffledAnswers(shuffleArray([1, 2, 3, 4, 5, 6, 7]));
    setSelected(null);
    setIsCounting(false);
    setShowChoices(false);
    setHighlightIndex(-1);

    // Q: "How many fish?"
    playOneWithFallback(questionAudioPrimary, questionAudioFallback, () => {
      playOneWithFallback(letsCountPrimary, letsCountFallback, () => setShowChoices(true));
    });
  };

  // Try playing a file; if it errors, fallback to base number audio (lesson1)
  const playWithFallback = (primarySrc, fallbackSrc, onEnded) => {
    const audio = new Audio(primarySrc);
    activeAudio.current = audio;
    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
    };
    audio.onended = () => {
      cleanup();
      onEnded?.();
    };
    audio.onerror = () => {
      cleanup();
      const fb = new Audio(fallbackSrc);
      activeAudio.current = fb;
      fb.onended = onEnded || null;
      fb.onerror = onEnded || null;
      fb.play().catch(() => {});
    };
    audio.play().catch(() => {
      const fb = new Audio(fallbackSrc);
      activeAudio.current = fb;
      fb.onended = onEnded || null;
      fb.onerror = onEnded || null;
      fb.play().catch(() => {});
    });
  };

  const handleAnswer = (num) => {
    if (isCounting) return;
    setSelected(num);
    setIsCounting(true);
    let i = 1;

    const playNextNumber = () => {
      if (i <= num) {
        const word = numberAudioMap[i];
        const base3 = `/audio/lesson3/${word}.mp3`;
        const term3 = `/audio/lesson3/${word}_fish.mp3`;

        const base1 = `/audio/lesson1/${word}.mp3`;
        const term1 = `/audio/lesson1/${word}_fish.mp3`;

        setHighlightIndex(i - 1);

        // use terminal at last count, else base; fallback to lesson1
        playWithFallback(
          i === num ? term3 : base3,
          i === num ? term1 : base1,
          () => {
            setTimeout(() => {
              i++;
              playNextNumber();
            }, 600);
          }
        );
      } else {
        setTimeout(() => {
          if (num === correctAnswer) {
            playRandomAudio(correctAudios, correctFallbacks, () =>
              setTimeout(() => advanceRound(), 700)
            );
          } else {
            playRandomAudio(wrongAudios, wrongFallbacks, () =>
              setTimeout(() => {
                setIsCounting(false);
                setHighlightIndex(-1);
              }, 600)
            );
          }
        }, 400);
      }
    };

    playNextNumber();
  };

  const advanceRound = () => {
    const isLast = roundIndex >= rounds - 1;
    if (isLast) onNext?.();
    else setRoundIndex((i) => i + 1);
  };

  const progressText = `${roundIndex + 1}/${rounds}`;

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
              onMouseEnter={(e) => {
                if (!isCounting) e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                if (!isCounting)
                  e.currentTarget.style.transform =
                    selected === num ? "scale(1.08)" : "scale(1)";
              }}
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