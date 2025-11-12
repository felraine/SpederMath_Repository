// src/lessons/lesson4/TeachScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../css/overlays.css";

const TeachScreen = ({ onNext }) => {
  // ========== CONFIG ==========
  const MAX_N = 10;

  // Prelude: summarize 1–7 (review-style) before introducing 8–10
  const PRELUDE = 0;

  // Intro now starts at 8 and ends at 10 (so 1–7 aren’t repeated one-by-one)
  const INTRO_START = 8;
  const INTRO_END = 10;

  const REVIEW_STEP = MAX_N + 1;
  const COUNT_START = REVIEW_STEP + 1;
  const COUNT_END = COUNT_START + MAX_N - 1;

  const [step, setStep] = useState(PRELUDE);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [reviewFinished, setReviewFinished] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);

  // Counting visuals (birds)
  const [fishSet, setFishSet] = useState([]);

  // --- Challenge state (after COUNT_END) ---
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeFish, setChallengeFish] = useState([]); // exactly MAX_N items
  const [targetIndex, setTargetIndex] = useState(1);       // 1..MAX_N positional

  const MAX_CHALLENGE_ROUNDS = 5;
  const [challengeRounds, setChallengeRounds] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const [remainingTargets, setRemainingTargets] = useState([
    // prioritize newly introduced numbers first
    8, 9, 10, ...[1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5),
  ]);

  // Preface before first counting step
  const [prefacePlayed, setPrefacePlayed] = useState(false);

  // Prelude control
  const [preludeFinished, setPreludeFinished] = useState(false);

  const audioRef = useRef(null);
  const playVersion = useRef(0); // cancels stale sequences

  // ====== Assets ======
  const stepData = {
    1:  { title: "One",   img: "/photos/number_pngs/number_1.png",  alt: "Number 1",  audio: "/audio/numbers/one.mp3" },
    2:  { title: "Two",   img: "/photos/number_pngs/number_2.png",  alt: "Number 2",  audio: "/audio/numbers/two.mp3" },
    3:  { title: "Three", img: "/photos/number_pngs/number_3.png",  alt: "Number 3",  audio: "/audio/numbers/three.mp3" },
    4:  { title: "Four",  img: "/photos/number_pngs/number_4.png",  alt: "Number 4",  audio: "/audio/numbers/four.mp3" },
    5:  { title: "Five",  img: "/photos/number_pngs/number_5.png",  alt: "Number 5",  audio: "/audio/numbers/five.mp3" },
    6:  { title: "Six",   img: "/photos/number_pngs/number_6.png",  alt: "Number 6",  audio: "/audio/numbers/six.mp3" },
    7:  { title: "Seven", img: "/photos/number_pngs/number_7.png",  alt: "Number 7",  audio: "/audio/numbers/seven.mp3" },
    8:  { title: "Eight", img: "/photos/number_pngs/number_8.png",  alt: "Number 8",  audio: "/audio/numbers/eight.mp3" },
    9:  { title: "Nine",  img: "/photos/number_pngs/number_9.png",  alt: "Number 9",  audio: "/audio/numbers/nine.mp3" },
    10: { title: "Ten",   img: "/photos/number_pngs/number_10.png", alt: "Number 10", audio: "/audio/numbers/ten.mp3" },
  };

  const numberWord = { 1:"one",2:"two",3:"three",4:"four",5:"five",6:"six",7:"seven",8:"eight",9:"nine",10:"ten" };
  const numberWordsTitle = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten"];

  // Build counting audio arrays dynamically; prefer lesson4 terminal "_bird" then fall back to plain number
  const countingAudiosFor = (n) =>
    Array.from({ length: n }, (_, i) => {
      const k = i + 1;
      const w = numberWord[k];
      return k === n
        ? `/audio/lesson4/${w}_bird.mp3` // optional; will fallback below
        : `/audio/numbers/${w}.mp3`;
    });

  // Birds art
  const FISH_IMAGES = [
    "/photos/lesson4/bird1.png",
    "/photos/lesson4/bird2.png",
    "/photos/lesson4/bird3.png",
    "/photos/lesson4/bird4.png",
  ];

  // Challenge audios (fallback to just the number if specific prompt isn’t available)
  const challengePromptAudio = (n) => `/audio/lesson4/click_${numberWord[n]}_bird.mp3`;
  const challengeCorrectAudio = (n) => `/audio/lesson4/correct_bird_${numberWord[n]}.mp3`;
  const challengeWrongAudio = "/audio/lesson1/try_again.mp3";

  // Review VO
  const LETS_REVIEW_AUDIO = ["/audio/lesson4/lets_review.mp3", "/audio/lesson1/lets_review.mp3"];

  // Generic prelude VO (same pattern as L3)
  const VO_NOW_THAT = "/audio/numbers/now_that_youve_learned_numbers.mp3";
  const VO_AFTER_GENERIC = "/audio/numbers/lets_introduce_numbers_after.mp3"; // “after …”

  /** Promise-based audio play that respects “latest playVersion” */
  const playAudioAsync = (src) => {
    const myVersion = ++playVersion.current;
    return new Promise((resolve) => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        const a = new Audio(src);
        audioRef.current = a;
        setIsAudioPlaying(true);

        const cleanup = () => {
          if (myVersion !== playVersion.current) return;
          setIsAudioPlaying(false);
          resolve();
        };

        a.onended = cleanup;
        a.onerror = cleanup;
        a.play().catch(() => cleanup());
      } catch {
        setIsAudioPlaying(false);
        resolve();
      }
    });
  };

  // Fallback wrapper: try primary, fallback to alt if missing
  const playWithFallback = (primary, fallback) =>
    new Promise((resolve) => {
      const myVersion = ++playVersion.current;
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
      const a = new Audio(primary);
      audioRef.current = a;
      setIsAudioPlaying(true);

      const end = () => {
        if (myVersion !== playVersion.current) return;
        setIsAudioPlaying(false);
        resolve();
      };

      a.onended = end;
      a.onerror = () => {
        const b = new Audio(fallback);
        audioRef.current = b;
        b.onended = end;
        b.onerror = end;
        b.play().catch(end);
      };
      a.play().catch(() => {
        const b = new Audio(fallback);
        audioRef.current = b;
        b.onended = end;
        b.onerror = end;
        b.play().catch(end);
      });
    });

  const pickRandomFish = (n) =>
    Array.from({ length: n }, () => FISH_IMAGES[Math.floor(Math.random() * FISH_IMAGES.length)]);

  // ====== Prelude (multi-mp3) for 1–7 with emphasis grow ======
  useEffect(() => {
    if (step !== PRELUDE) return;

    let cancelled = false;
    setPreludeFinished(false);
    setHighlightIndex(null);

    const run = async () => {
      // small delay to help autoplay
      await new Promise((r) => setTimeout(r, 400));

      // 1) “Now that you’ve learned numbers ...”
      await playAudioAsync(VO_NOW_THAT);
      if (cancelled) return;

      // 2) one → two → ... → seven (each number grows while its mp3 plays)
      for (let i = 1; i <= 7; i++) {
        if (cancelled) return;
        setHighlightIndex(i);
        await playAudioAsync(stepData[i].audio);
        if (cancelled) return;
        setHighlightIndex(null);
        if (i < 7) await new Promise((r) => setTimeout(r, 300));
      }

      // 3) “Let’s introduce you to numbers that come after…” then reinforce SEVEN
      if (cancelled) return;
      await playAudioAsync(VO_AFTER_GENERIC);
      if (cancelled) return;

      setHighlightIndex(7);
      await playAudioAsync(stepData[7].audio);
      if (cancelled) return;
      setHighlightIndex(null);

      if (!cancelled) setPreludeFinished(true);
    };

    run();

    return () => {
      cancelled = true;
      playVersion.current++;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setHighlightIndex(null);
    };
  }, [step]);

  // Intro numbers (8–10): speak each number upon entering that step
  useEffect(() => {
    if (step < INTRO_START || step > INTRO_END) return;
    const current = stepData[step];
    if (!current) return;
    playAudioAsync(current.audio);
  }, [step]);

  // Start challenge round with non-repeating target pool
  const startChallengeRound = async () => {
    setRoundComplete(false);

    // Refill pool when exhausted (keep 8–10 early again)
    let pool = remainingTargets;
    if (pool.length === 0) {
      pool = [8, 9, 10, ...[1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5)];
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    const target = pool[randomIndex];
    setRemainingTargets(pool.filter((_, i) => i !== randomIndex));

    const imgs = pickRandomFish(MAX_N);
    setChallengeFish(imgs);

    setTargetIndex(target);
    setChallengeActive(true);
    setReviewFinished(false);

    // Prompt with fallback to just the number audio
    await playWithFallback(
      challengePromptAudio(target),
      stepData[target].audio
    );
  };

  const handleNext = () => {
    // From Prelude -> first intro step (8)
    if (step === PRELUDE) return setStep(INTRO_START);

    // Intro pages (8 -> 10)
    if (step >= INTRO_START && step < INTRO_END) return setStep((p) => p + 1);

    // Move from last intro (10) to review
    if (step === INTRO_END) return setStep(REVIEW_STEP);

    // From review to first counting step
    if (step === REVIEW_STEP) return setStep(COUNT_START);

    // Counting steps
    if (step >= COUNT_START && step < COUNT_END) return setStep((p) => p + 1);

    // After last counting step -> challenge rounds
    if (step === COUNT_END) {
      if (isAudioPlaying) return;
      if (challengeRounds < MAX_CHALLENGE_ROUNDS) {
        startChallengeRound();
      } else {
        setChallengeActive(false);
        onNext?.();
      }
    }
  };

  // Review: play “Let’s review!” THEN 1→10 sequence
  useEffect(() => {
    if (step !== REVIEW_STEP) return;
    let cancelled = false;
    setReviewFinished(false);

    const run = async () => {
      await playWithFallback(LETS_REVIEW_AUDIO[0], LETS_REVIEW_AUDIO[1]);
      if (cancelled) return;

      for (let i = 1; i <= MAX_N; i++) {
        if (cancelled) return;
        setHighlightIndex(i);
        await playAudioAsync(stepData[i].audio);
        setHighlightIndex(null);
        if (i < MAX_N) await new Promise((r) => setTimeout(r, 600));
      }
      if (!cancelled) setReviewFinished(true);
    };

    run();
    return () => {
      cancelled = true;
      playVersion.current++;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setHighlightIndex(null);
    };
  }, [step]);

  // Counting steps (1..10) — birds on the left, number panel on the right
  useEffect(() => {
    if (step < COUNT_START || step > COUNT_END) return;
    let cancelled = false;
    setReviewFinished(false);
    setCurrentCount(0);
    setChallengeActive(false); // reset on any counting step

    const count = step - COUNT_START + 1;
    const audios = countingAudiosFor(count);

    const run = async () => {
      setFishSet(pickRandomFish(count));

      if (step === COUNT_START && !prefacePlayed) {
        setPrefacePlayed(true);
        // small settle delay
        await new Promise((r) => setTimeout(r, 500));
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }

      // Counting sequence 1..count
      for (let i = 0; i < audios.length; i++) {
        if (cancelled) return;
        setHighlightIndex(i + 1);
        setCurrentCount(i + 1);

        const k = i + 1;
        const primary = audios[i];
        const fallback =
          primary.endsWith("_bird.mp3")
            ? `/audio/numbers/${numberWord[k]}.mp3`
            : primary;

        await playWithFallback(primary, fallback);

        setHighlightIndex(null);
        if (i < audios.length - 1) await new Promise((r) => setTimeout(r, 800));
      }
      if (cancelled) return;

      setReviewFinished(true);
    };

    run();

    return () => {
      cancelled = true;
      playVersion.current++;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setHighlightIndex(null);
    };
  }, [step, prefacePlayed]);

  // Handle challenge clicks
  const handleChallengeClick = async (clickedIndex) => {
    if (!challengeActive || isAudioPlaying || roundComplete) return;

    if (clickedIndex === targetIndex) {
      await playWithFallback(
        challengeCorrectAudio(targetIndex),
        stepData[targetIndex].audio
      );
      setRoundComplete(true);
      setChallengeRounds((r) => r + 1);
      setReviewFinished(true); // enable bottom button
    } else {
      await playAudioAsync(challengeWrongAudio);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      playVersion.current++;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // ======= UI =======
  return (
    <section className="lesson-screen relative w-full h-full flex flex-col items-center justify-start">
      {/* Headers */}
      {step === PRELUDE && (
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">
            Quick Review: 1 to 7
          </h1>
        </div>
      )}

      {step === REVIEW_STEP && (
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-md">Let’s Review!</h1>
        </div>
      )}
      {step === COUNT_START && (
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-3xl font-bold drop-shadow-[0_4px_3px_rgba(0,0,0,0.6)]">
            Now let’s count the birds!
          </h1>
        </div>
      )}

      {/* Content */}
      <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
        {/* Prelude (review-style row for 1–7 with grow on each mp3) */}
        {step === PRELUDE && (
          <div className="grid grid-cols-5 gap-6 sm:gap-10 justify-center items-center flex-wrap mt-2">
            {[1,2,3,4,5,6,7].map((num) => (
              <motion.img
                key={num}
                src={stepData[num].img}
                alt={stepData[num].alt}
                className="max-w-[120px] sm:max-w-[140px] w-full"
                style={{
                  filter:
                    "drop-shadow(0 8px 18px rgba(0,0,0,0.35)) drop-shadow(0 0 6px rgba(255,255,255,0.6))",
                }}
                animate={{ scale: highlightIndex === num ? 1.35 : 1 }}
                transition={{ duration: 0.25 }}
              />
            ))}
          </div>
        )}

        {/* Intro numbers (8–10) */}
        {step >= INTRO_START && step <= INTRO_END && (
          <div className="flex flex-col items-center -mt-2 gap-6">
            <h2 className="text-4xl sm:text-5xl font-bold">{stepData[step].title}</h2>

            {/* ==== 10 as 1 + 0 ==== */}
            {step === 10 ? (
              <motion.div
                key="intro-10"
                className="inline-flex items-center justify-center gap-2 sm:gap-3"
                style={{ filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.35)) drop-shadow(0 0 6px rgba(255,255,255,0.6))" }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <img src="/photos/number_pngs/number_1.png" alt="Number 1" className="h-[150px] sm:h-[190px] md:h-[230px] object-contain" draggable={false} />
                <img src="/photos/number_pngs/number_0.png" alt="Number 0" className="h-[150px] sm:h-[190px] md:h-[230px] object-contain" draggable={false} />
              </motion.div>
            ) : (
              <motion.img
                key={step}
                src={stepData[step].img}
                alt={stepData[step].alt}
                className="w-[150px] sm:w-[190px] md:w-[230px]"
                style={{ filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.35)) drop-shadow(0 0 6px rgba(255,255,255,0.6))" }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
          </div>
        )}

        {/* Review row (1–10) with special 10 */}
        {step === REVIEW_STEP && (
          <div className="w-full flex justify-center">
            <div className="grid grid-cols-5 gap-x-8 gap-y-10 px-4 sm:px-8 pb-36 md:pb-40 max-w-[1200px] place-items-center">
              {Array.from({ length: MAX_N }, (_, i) => i + 1).map((num) => (
                <div key={num} className="flex items-center justify-center">
                  {num === 10 ? (
                    <motion.div
                      className="flex items-center justify-center w-[140px] sm:w-[160px] md:w-[180px]"
                      animate={{ scale: highlightIndex === 10 ? 1.35 : 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <img src="/photos/number_pngs/number_1.png" alt="Number 1" className="h-[120px] sm:h-[140px] md:h-[160px] object-contain" draggable={false} />
                      <img src="/photos/number_pngs/number_0.png" alt="Number 0" className="h-[120px] sm:h-[140px] md:h-[160px] object-contain" draggable={false} />
                    </motion.div>
                  ) : (
                    <motion.img
                      src={stepData[num].img}
                      alt={stepData[num].alt}
                      className="w-[120px] sm:w-[140px] md:w-[160px]"
                      animate={{ scale: highlightIndex === num ? 1.35 : 1 }}
                      transition={{ duration: 0.4 }}
                      draggable={false}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Counting OR Challenge */}
        {step >= COUNT_START && step <= COUNT_END && (
          <>
            {!challengeActive && (
              <div className="flex w-full px-6 sm:px-10 -mt-1 items-center">
                {/* LEFT: bird area */}
                <div className="flex-1 min-w-0">
                  {currentCount === 10 ? (
                    // --- Special layout for 10: 4-4-2 centered and shifted left ---
                    <div className="grid grid-cols-4 gap-6 sm:gap-8 place-items-center mr-10 sm:mr-16 md:mr-20">
                      {[
                        0, 1, 2, 3,        // row 1 (4)
                        4, 5, 6, 7,        // row 2 (4)
                        null, 8, 9, null,  // row 3 (centered 2 → cols 2 & 3)
                      ].map((birdIdx, slot) =>
                        birdIdx === null ? (
                          <div key={`spacer-${slot}`} className="w-[100px] sm:w-[120px] md:w-[140px]" />
                        ) : (
                          <motion.img
                            key={`bird-${birdIdx}`}
                            src={fishSet[birdIdx]}
                            alt="Bird"
                            className="w-[100px] sm:w-[120px] md:w-[140px]"
                            initial={{ opacity: 0, scale: 0.6, y: 12 }}
                            animate={{
                              opacity: 1,
                              scale: highlightIndex === birdIdx + 1 ? 1.3 : 1,
                              y: 0,
                            }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ duration: 0.5 }}
                          />
                        )
                      )}
                    </div>
                  ) : (
                    // default flow for counts other than 10
                    <div className="flex flex-row gap-6 sm:gap-8 flex-wrap mr-10 sm:mr-16 md:mr-20">
                      <AnimatePresence>
                        {fishSet.slice(0, currentCount).map((src, idx) => (
                          <motion.img
                            key={`${src}-${idx}`}
                            src={src}
                            alt="Bird"
                            className="w-[100px] sm:w-[120px] md:w-[140px]"
                            initial={{ opacity: 0, scale: 0.6, y: 12 }}
                            animate={{
                              opacity: 1,
                              scale: highlightIndex === idx + 1 ? 1.3 : 1,
                              y: 0,
                            }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ duration: 0.5 }}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* RIGHT: fixed-width number panel — cannot overlap */}
                <div className="w-[220px] sm:w-[260px] md:w-[300px] flex-shrink-0 flex flex-col items-center ml-4">
                  {currentCount > 0 && (
                    <>
                      {currentCount === 10 ? (
                        <motion.div
                          key="count-10"
                          className="inline-flex items-center justify-center gap-2 sm:gap-3"
                          style={{ filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.35)) drop-shadow(0 0 8px rgba(255,255,255,0.65))" }}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        >
                          <img src="/photos/number_pngs/number_1.png" alt="Number 1" className="h-[170px] sm:h-[200px] md:h-[220px] object-contain" draggable={false} />
                          <img src="/photos/number_pngs/number_0.png" alt="Number 0" className="h-[170px] sm:h-[200px] md:h-[220px] object-contain" draggable={false} />
                        </motion.div>
                      ) : (
                        <motion.img
                          key={`num-${currentCount}-bird`}
                          src={stepData[currentCount]?.img}
                          alt={stepData[currentCount]?.alt}
                          className="w-[170px] sm:w-[200px] md:w-[220px]"
                          style={{ filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.35)) drop-shadow(0 0 8px rgba(255,255,255,0.65))" }}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      )}

                      <motion.span
                        className="text-3xl sm:text-4xl font-bold capitalize mt-1"
                        animate={{ opacity: [0, 1], y: [8, 0] }}
                        transition={{ duration: 0.35 }}
                      >
                        {numberWordsTitle[currentCount]}
                      </motion.span>
                    </>
                  )}
                </div>
              </div>
            )}

            {challengeActive && (
              <div className="flex flex-col items-center gap-6">
                <h3 className="text-2xl sm:text-3xl font-bold">
                  Click on <span className="underline">bird number {targetIndex}</span>.
                </h3>

                <div className="grid grid-cols-5 gap-6 sm:gap-8 flex-wrap justify-center">
                  {challengeFish.map((src, i) => (
                    <motion.div
                      key={`${src}-challenge-${i}`}
                      className="relative w-[110px] sm:w-[130px] md:w-[150px] cursor-pointer"
                      initial={{ opacity: 0, scale: 0.85, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleChallengeClick(i + 1)}
                      aria-label={`Bird number ${i + 1}`}
                    >
                      <motion.img
                        src={src}
                        alt={`Bird number ${i + 1}`}
                        className="w-full h-auto select-none pointer-events-none"
                        draggable={false}
                      />
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-white text-3xl sm:text-4xl font-extrabold drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                          {i + 1}
                        </span>
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Buttons */}
      <div className="absolute bottom-6 right-6">
        {/* Prelude button */}
        {step === PRELUDE && (
          <button
            onClick={handleNext}
            disabled={!preludeFinished}
            className={`px-6 py-3 text-lg rounded-lg transition ${
              !preludeFinished ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
            }`}
            title={!preludeFinished ? "Please listen first" : "Next"}
          >
            Next
          </button>
        )}

        {/* Intro buttons (8–10) */}
        {step >= INTRO_START && step <= INTRO_END && (
          <button
            onClick={handleNext}
            disabled={isAudioPlaying}
            className={`px-6 py-3 text-lg rounded-lg transition ${
              isAudioPlaying ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
            }`}
            title={isAudioPlaying ? "Please listen first" : "Next"}
          >
            {step < INTRO_END ? "Next" : "Review"}
          </button>
        )}

        {/* Review button */}
        {step === REVIEW_STEP && (
          <button
            onClick={handleNext}
            disabled={!reviewFinished}
            className={`px-6 py-3 text-lg rounded-lg transition ${
              !reviewFinished ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
            }`}
            title={!reviewFinished ? "Please finish the review audio" : "Continue"}
          >
            Continue
          </button>
        )}

        {/* Counting & Challenge buttons */}
        {step >= COUNT_START && step <= COUNT_END && (
          <button
            onClick={handleNext}
            disabled={
              // During counting: wait for audio
              (!challengeActive && (!reviewFinished || isAudioPlaying)) ||
              // During challenge: wait until a round is complete
              (challengeActive &&
                (isAudioPlaying ||
                  (!roundComplete && challengeRounds > 0 && challengeRounds < MAX_CHALLENGE_ROUNDS)))
            }
            className={`px-6 py-3 text-lg rounded-lg transition ${
              (!challengeActive && (!reviewFinished || isAudioPlaying)) ||
              (challengeActive &&
                (isAudioPlaying ||
                  (!roundComplete && challengeRounds > 0 && challengeRounds < MAX_CHALLENGE_ROUNDS)))
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            title={
              !challengeActive
                ? !reviewFinished
                  ? "Please finish listening first"
                  : "Next"
                : challengeRounds >= MAX_CHALLENGE_ROUNDS
                ? "Continue"
                : roundComplete
                ? "Next Round"
                : "Finish this round first"
            }
          >
            {!challengeActive
              ? "Next"
              : challengeRounds >= MAX_CHALLENGE_ROUNDS
              ? "Continue"
              : challengeRounds === 0
              ? "Start"
              : roundComplete
              ? "Next Round"
              : "Next Round"}
          </button>
        )}
      </div>
    </section>
  );
};

export default TeachScreen;
