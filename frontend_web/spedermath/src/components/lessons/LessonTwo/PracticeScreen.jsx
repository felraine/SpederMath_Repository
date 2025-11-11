import React, { useEffect, useState, useRef } from "react";
import "../../css/overlays.css";

const PracticeScreenUnified = ({ onNext, rounds = 5 }) => {
  const [roundIndex, setRoundIndex] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState(1);
  const [selected, setSelected] = useState(null);
  const [isCounting, setIsCounting] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState([1, 2, 3, 4, 5]);
  const [showChoices, setShowChoices] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [fishSet, setFishSet] = useState([]);

  const activeAudio = useRef(null);
  const timeoutsRef = useRef([]);
  const hasAdvancedRef = useRef(false); // ← prevent double-advance per round

  // ---- assets ----
  const numberAudioMap = { 1: "one", 2: "two", 3: "three", 4: "four", 5: "five" };
  const questionAudio = "/audio/lesson2/how_many_star.mp3";
  const letsCountAudio = "/audio/lesson1/lets_count.mp3";
  const correctAudios = [
    "/audio/lesson1/correct/good_job.mp3",
    "/audio/lesson1/correct/nice_work.mp3",
  ];
  const wrongAudios = [
    "/audio/lesson1/wrong/good_attempt.mp3",
    "/audio/lesson1/wrong/nice_try.mp3",
  ];

  const fishImages = [
    "/photos/lesson2/star.png",
  ];

  const labelPlural = "stars";

  const addTimeout = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  };
  const clearAllTimeouts = () => {
    for (const id of timeoutsRef.current) clearTimeout(id);
    timeoutsRef.current = [];
  };
  const stopAudio = () => {
    if (activeAudio.current) {
      try {
        activeAudio.current.onended = null;
        activeAudio.current.onerror = null;
        activeAudio.current.pause();
        activeAudio.current.currentTime = 0;
      } catch {}
      activeAudio.current = null;
    }
  };

  // NEW — non-repeating pool of 1..5
  const poolRef = useRef([]);
  const poolIndexRef = useRef(0);

  const refillPool = () => {
    poolRef.current = shuffleArray([1, 2, 3, 4, 5]); // reuse your shuffleArray
    poolIndexRef.current = 0;
  };

  useEffect(() => {
    // build the first pool on mount
    refillPool();
  }, []);

  const nextNonRepeatingCount = () => {
    // when we exhaust the pool, reshuffle for a fresh cycle
    if (poolIndexRef.current >= poolRef.current.length) refillPool();
    const n = poolRef.current[poolIndexRef.current];
    poolIndexRef.current += 1;
    return n;
  };

  const shuffleArray = (array) =>
    array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

  const playRandomAudio = (audioList, callback) => {
    const randomFile = audioList[Math.floor(Math.random() * audioList.length)];
    const audio = new Audio(randomFile);
    stopAudio();
    activeAudio.current = audio;
    audio.play().catch(() => {});
    if (callback) audio.onended = callback;
  };

  useEffect(() => {
    startNewRound();
    return () => {
      // cleanup on unmount or before next round starts
      stopAudio();
      clearAllTimeouts();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex]);

  const startNewRound = () => {
    stopAudio();
    clearAllTimeouts();
    hasAdvancedRef.current = false;

    // pick 1–5 fishes
    const randomCount = nextNonRepeatingCount();

    // randomized fish images for this round
    const roundFish = Array.from({ length: randomCount }, () => {
      const idx = Math.floor(Math.random() * fishImages.length);
      return fishImages[idx];
    });

    setCorrectAnswer(randomCount);
    setFishSet(roundFish);
    setShuffledAnswers(shuffleArray([1, 2, 3, 4, 5]));
    setSelected(null);
    setIsCounting(false);
    setShowChoices(false);
    setHighlightIndex(-1);

    const q1 = new Audio(questionAudio);
    stopAudio();
    activeAudio.current = q1;
    q1.play().catch(() => {});
    q1.onended = () => {
      const q2 = new Audio(letsCountAudio);
      stopAudio();
      activeAudio.current = q2;
      q2.play().catch(() => {});
      q2.onended = () => setShowChoices(true);
    };
  };

  const playWithFallback = (primarySrc, fallbackSrc, onEnded) => {
    const audio = new Audio(primarySrc);
    stopAudio();
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
      stopAudio();
      activeAudio.current = fb;
      fb.onended = onEnded || null;
      fb.play().catch(() => {});
    };
    audio.play().catch(() => {
      // If play fails (autoplay), still try fallback
      const fb = new Audio(fallbackSrc);
      stopAudio();
      activeAudio.current = fb;
      fb.onended = onEnded || null;
      fb.play().catch(() => {});
    });
  };

  const advanceRound = () => {
    if (hasAdvancedRef.current) return; // already advanced this round
    hasAdvancedRef.current = true;

    // Use functional update so we read the freshest state
    setRoundIndex((prev) => {
      const isLast = prev >= rounds - 1;
      if (isLast) {
        onNext?.();
        return prev; // keep at last; don’t overflow
      }
      return prev + 1;
    });
  };

  const handleAnswer = (num) => {
    if (isCounting) return;
    setSelected(num);
    setIsCounting(true);
    let i = 1;

    const playNextNumber = () => {
      if (i <= num) {
        const base = `/audio/numbers/${numberAudioMap[i]}.mp3`;
        const terminal = `/audio/lesson2/${numberAudioMap[i]}_star.mp3`;

        setHighlightIndex(i - 1);

        playWithFallback(
          i === num ? terminal : base,
          base,
          () => {
            addTimeout(() => {
              i++;
              playNextNumber();
            }, 400);
          }
        );
      } else {
        addTimeout(() => {
          if (num === correctAnswer) {
            playRandomAudio(correctAudios, () => addTimeout(advanceRound, 700));
          } else {
            playRandomAudio(wrongAudios, () =>
              addTimeout(() => {
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

  const clampedIndex = Math.min(roundIndex, Math.max(0, rounds - 1));
  const progressText = `${clampedIndex + 1}/${rounds}`;

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
