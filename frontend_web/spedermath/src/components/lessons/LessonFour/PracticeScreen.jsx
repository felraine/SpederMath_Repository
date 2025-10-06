import React, { useEffect, useState, useRef } from "react";
import "../../css/overlays.css";

/** Uses /audio/numbers/{word}.mp3 for counting (no TTS). */
const PracticeScreenUnified = ({ onNext, rounds = 3 }) => {
  const [roundIndex, setRoundIndex] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState(1);
  const [selected, setSelected] = useState(null);
  const [isCounting, setIsCounting] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState([1,2,3,4,5,6,7,8,9,10]);
  const [showChoices, setShowChoices] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [fishSet, setFishSet] = useState([]);

  const activeAudio = useRef(null);
  const runRef = useRef(0);           // cancel token for an in-flight run
  const timeoutsRef = useRef([]);     // collect timeouts for cleanup
  const finishedRef = useRef(false);  // ensure result SFX plays once

  // ---- assets ----
  const numberAudioMap = {1:"one",2:"two",3:"three",4:"four",5:"five",6:"six",7:"seven",8:"eight",9:"nine",10:"ten"};
  const NUMBER_DIR = "/audio/numbers";           // <-- UPDATED
  const questionAudio = "/audio/lesson1/how_many_fish.mp3";
  const letsCountAudio = "/audio/lesson1/lets_count.mp3";
  const correctAudios = ["/audio/lesson1/correct/good_job.mp3","/audio/lesson1/correct/nice_work.mp3"];
  const wrongAudios   = ["/audio/lesson1/wrong/good_attempt.mp3","/audio/lesson1/wrong/nice_try.mp3"];

  const fishImages = [
    "/photos/lesson1/fish1.png",
    "/photos/lesson1/fish2.png",
    "/photos/lesson1/fish3.png",
    "/photos/lesson1/fish4.png",
  ];
  const labelPlural = "fishes";

  const shuffleArray = (array) =>
    array.map((v) => ({ v, r: Math.random() }))
         .sort((a, b) => a.r - b.r)
         .map(({ v }) => v);

  const clearTimers = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };
  const setT = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  };

  const stopAllAudio = () => {
    if (activeAudio.current) {
      try { activeAudio.current.pause(); } catch {}
      activeAudio.current = null;
    }
  };

  const playRandomAudio = (audioList, callback) => {
    const src = audioList[Math.floor(Math.random() * audioList.length)];
    const a = new Audio(src);
    activeAudio.current = a;
    a.onended = callback || null;
    a.onerror = callback || null;
    a.play().catch(() => callback && callback());
  };

  useEffect(() => {
    startNewRound();
    return () => {
      runRef.current++;    // cancel pending
      clearTimers();
      stopAllAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex]);

  const startNewRound = () => {
    // reset guards
    runRef.current++;
    finishedRef.current = false;
    clearTimers();
    stopAllAudio();

    // 1..10 fishes
    const randomCount = Math.floor(Math.random() * 10) + 1;
    const roundFish = Array.from({ length: randomCount }, () => {
      const idx = Math.floor(Math.random() * fishImages.length);
      return fishImages[idx];
    });

    setCorrectAnswer(randomCount);
    setFishSet(roundFish);
    setShuffledAnswers(shuffleArray(Array.from({ length: 10 }, (_, i) => i + 1)));
    setSelected(null);
    setIsCounting(false);
    setShowChoices(false);
    setHighlightIndex(-1);

    const q1 = new Audio(questionAudio);
    activeAudio.current = q1;
    q1.play().catch(() => {});
    q1.onended = () => {
      const q2 = new Audio(letsCountAudio);
      activeAudio.current = q2;
      q2.play().catch(() => {});
      q2.onended = () => setShowChoices(true);
    };
  };

  /** Try each URL in sequence. If all fail, just advance silently (no TTS). */
  const playChain = (urls, onDone) => {
    const myRun = runRef.current;
    const list = [...new Set(urls.filter(Boolean))];
    let i = 0;
    let done = false;

    const finish = () => {
      if (done || myRun !== runRef.current) return;
      done = true;
      onDone?.();
    };

    const tryNext = () => {
      if (myRun !== runRef.current) return;
      if (i >= list.length) return finish(); // nothing playable
      const src = list[i++];
      const a = new Audio(src);
      activeAudio.current = a;
      a.onended = finish;
      a.onerror = () => tryNext();
      a.play().catch(() => tryNext());
    };

    tryNext();
  };

  const handleAnswer = (num) => {
    if (isCounting) return;

    // fresh guarded run for this click
    runRef.current++;
    const myRun = runRef.current;
    finishedRef.current = false;
    clearTimers();
    stopAllAudio();

    setSelected(num);
    setIsCounting(true);

    let i = 1;

    const stepAfterAudio = () => {
      if (myRun !== runRef.current) return;
      setT(() => {
        if (myRun !== runRef.current) return;
        i++;
        playNextNumber();
      }, 600); // fixed gap between counts
    };

    const playNextNumber = () => {
      if (myRun !== runRef.current) return;

      if (i <= num) {
        const name = numberAudioMap[i];

        // UPDATED: use /audio/numbers/{word}.mp3 as primary
        const baseNumbers = `${NUMBER_DIR}/${name}.mp3`;        // primary
        const baseL1      = `/audio/lesson1/${name}.mp3`;       // optional fallback if you have it
        const terminal    = `/audio/lesson1/${name}_fish.mp3`;  // only when i === num (optional)

        setHighlightIndex(i - 1);

        const sources = i === num
          ? [terminal, baseNumbers, baseL1]
          : [baseNumbers, baseL1];

        playChain(sources, stepAfterAudio);
      } else {
        // finished counting
        setT(() => {
          if (myRun !== runRef.current || finishedRef.current) return;
          finishedRef.current = true;

          if (num === correctAnswer) {
            playRandomAudio(correctAudios, () => {
              if (myRun !== runRef.current) return;
              setT(() => advanceRound(), 700);
            });
          } else {
            playRandomAudio(wrongAudios, () => {
              if (myRun !== runRef.current) return;
              setIsCounting(false);
              setHighlightIndex(-1);
            });
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

      <div className="fish-wrap">
        {fishSet.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={labelPlural}
            className="fish-img"
            style={{
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
        <div className="choices-wrap">
          <div className="choices-grid">
            {shuffledAnswers.map((n) => (
              <button
                key={n}
                onClick={() => handleAnswer(n)}
                className="choice-btn"
                style={{
                  backgroundColor:
                    selected === n
                      ? n === correctAnswer
                        ? "#4CAF50"
                        : "#F44336"
                      : "rgba(0,0,0,0.25)",
                  transform: selected === n ? "scale(1.06)" : "scale(1)",
                  opacity: isCounting && selected !== n ? 0.7 : 1,
                  cursor: isCounting ? "not-allowed" : "pointer",
                }}
                disabled={isCounting}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default PracticeScreenUnified;
