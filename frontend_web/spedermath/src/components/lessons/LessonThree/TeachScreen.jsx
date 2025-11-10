// src/lessons/lesson3/TeachScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../css/overlays.css";

const TeachScreen = ({ onNext, meta }) => {
  // ========== CONFIG ==========
  const MAX_N = 7;

  const INTRO_START = 1;
  const INTRO_END = MAX_N;
  const REVIEW_STEP = MAX_N + 1;
  const COUNT_START = REVIEW_STEP + 1;
  const COUNT_END = COUNT_START + MAX_N - 1;

  const [step, setStep] = useState(INTRO_START);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [reviewFinished, setReviewFinished] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);

  // Counting visuals for the left side during counting steps
  const [fishSet, setFishSet] = useState([]);

  // --- Challenge state (only after COUNT_END) ---
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeFish, setChallengeFish] = useState([]); // exactly MAX_N fish
  const [targetIndex, setTargetIndex] = useState(1);      // 1..MAX_N positional

  const MAX_CHALLENGE_ROUNDS = 3;
  const [challengeRounds, setChallengeRounds] = useState(0); // 0..3
  const [roundComplete, setRoundComplete] = useState(false);

  // Preface before first counting step
  const prefacePlayedRef = useRef(false);

  const audioRef = useRef(null);
  const playVersion = useRef(0); // cancels stale sequences

  // ====== Assets ======
  const stepData = {
    1: { title: "One",   img: "/photos/number_pngs/number_1.png", alt: "Number 1", audio3: "/audio/numbers/one.mp3",   audio1: "/audio/lesson1/one.mp3" },
    2: { title: "Two",   img: "/photos/number_pngs/number_2.png", alt: "Number 2", audio3: "/audio/numbers/two.mp3",   audio1: "/audio/lesson1/two.mp3" },
    3: { title: "Three", img: "/photos/number_pngs/number_3.png", alt: "Number 3", audio3: "/audio/numbers/three.mp3", audio1: "/audio/lesson1/three.mp3" },
    4: { title: "Four",  img: "/photos/number_pngs/number_4.png", alt: "Number 4", audio3: "/audio/numbers/four.mp3",  audio1: "/audio/lesson1/four.mp3" },
    5: { title: "Five",  img: "/photos/number_pngs/number_5.png", alt: "Number 5", audio3: "/audio/numbers/five.mp3",  audio1: "/audio/lesson1/five.mp3" },
    6: { title: "Six",   img: "/photos/number_pngs/number_6.png", alt: "Number 6", audio3: "/audio/numbers/six.mp3",   audio1: "/audio/lesson1/six.mp3" },
    7: { title: "Seven", img: "/photos/number_pngs/number_7.png", alt: "Number 7", audio3: "/audio/numbers/seven.mp3", audio1: "/audio/lesson1/seven.mp3" },
  };

  const numberWord = { 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven" };
  const numberWordsTitle = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven"];

  // Build counting audio arrays dynamically; try lesson3 terminal "_fish" then fallback to lesson1/plain number
  const countingAudiosFor = (n) =>
    Array.from({ length: n }, (_, i) => {
      const k = i + 1;
      const w = numberWord[k];
      // terminal preferred in lesson3, fallback handled when played
      return k === n ? `/audio/lesson3/${w}_fish.mp3` : `/audio/numbers/${w}.mp3`;
    });

  const FISH_IMAGES = [
    "/photos/lesson3/monkey.png",
  ];

  const stopAudio = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch {}
  };

  const challengePromptAudio = (n) => ({
    primary: `/audio/lesson3/click_${numberWord[n]}_fish.mp3`,
    fallback: stepData[n].audio1 || `/audio/numbers/${numberWord[n]}.mp3`,
  });
  const challengeCorrectAudio = (n) => ({
    primary: `/audio/lesson3/correct_fish_${numberWord[n]}.mp3`,
    fallback: stepData[n].audio1 || `/audio/numbers/${numberWord[n]}.mp3`,
  });
  const challengeWrongAudio = { primary: "/audio/lesson3/try_again.mp3", fallback: "/audio/lesson1/try_again.mp3" };

  const COUNT_WITH_FISH_PREFACE = { primary: "/audio/lesson3/count_with_fish.mp3", fallback: "/audio/lesson1/count_with_fish.mp3" };
  const LETS_REVIEW_AUDIO       = { primary: "/audio/lesson3/lets_review.mp3",      fallback: "/audio/lesson1/lets_review.mp3" };

  /** Promise-based audio play (single) with robust fallback (no accidental double-plays) */
  const playWithFallback = (primary, fallback) =>
    new Promise((resolve) => {
      const myVersion = ++playVersion.current;     // invalidate older plays
      stopAudio();                                 // stop anything currently playing
      setIsAudioPlaying(true);

      let started = false;                         // becomes true if the primary actually starts
      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;
        if (myVersion !== playVersion.current) return; // superseded by newer play
        setIsAudioPlaying(false);
        resolve();
      };

      const tryFallback = () => {
        if (myVersion !== playVersion.current || finished) return;
        // Ensure primary is fully stopped before fallback
        try { audioRef.current?.pause?.(); } catch {}
        const b = new Audio(fallback);
        audioRef.current = b;

        const onEnd = () => { cleanupB(); finish(); };
        const onErr = () => { cleanupB(); finish(); };

        const cleanupB = () => {
          b.removeEventListener("ended", onEnd);
          b.removeEventListener("error", onErr);
        };

        b.addEventListener("ended", onEnd, { once: true });
        b.addEventListener("error", onErr, { once: true });
        b.play().catch(onErr);
      };

      const a = new Audio(primary);
      audioRef.current = a;

      const onPlay = () => { started = true; };
      const onEnd = () => { cleanupA(); finish(); };
      const onErr = () => {
        // Only fallback if the primary truly failed before playing
        cleanupA();
        if (!started) tryFallback();
        else finish();
      };

      const cleanupA = () => {
        a.removeEventListener("playing", onPlay);
        a.removeEventListener("ended", onEnd);
        a.removeEventListener("error", onErr);
      };

      a.addEventListener("playing", onPlay, { once: true });
      a.addEventListener("ended", onEnd, { once: true });
      a.addEventListener("error", onErr, { once: true });

      a.play().catch(() => {
        // Some browsers reject play() even when audio will eventually play.
        // Use a micro-delay to see if 'playing' fires; otherwise, fallback.
        setTimeout(() => {
          if (!started) {
            cleanupA();
            tryFallback();
          }
        }, 60);
      });
    });

  /** Promise-based audio play that respects “latest playVersion” (no fallback) */
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
          if (myVersion !== playVersion.current) return; // superseded
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

  useEffect(() => {
    if (step < INTRO_START || step > INTRO_END) return;

    let cancelled = false;
    const myVersion = ++playVersion.current;

    const run = async () => {
      stopAudio();
      const data = stepData[step];
      if (!data) return;
      await playWithFallback(data.audio3, data.audio1 || data.audio3);
    };

    run();

    return () => {
      cancelled = true;
      playVersion.current++;
      stopAudio();
    };
  }, [step]);

  const pickRandomFish = (n) =>
    Array.from({ length: n }, () => FISH_IMAGES[Math.floor(Math.random() * FISH_IMAGES.length)]);

  const startChallengeRound = async () => {
    setRoundComplete(false);
    const imgs = pickRandomFish(MAX_N);
    setChallengeFish(imgs);
    const target = 1 + Math.floor(Math.random() * MAX_N);
    setTargetIndex(target);
    setChallengeActive(true);
    setReviewFinished(false);

    const ap = challengePromptAudio(target);
    await playWithFallback(ap.primary, ap.fallback);
  };

  const handleNext = () => {
    if (step < INTRO_END) return setStep((p) => p + 1);
    if (step === INTRO_END) return setStep(REVIEW_STEP);
    if (step === REVIEW_STEP) return setStep(COUNT_START);
    if (step >= COUNT_START && step < COUNT_END) return setStep((p) => p + 1);

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

  // Review: play “Let’s review!” 
  useEffect(() => {
    if (step !== REVIEW_STEP) return;
    let cancelled = false;
    setReviewFinished(false);

    const run = async () => {
      // Make sure nothing from previous step is playing
      playVersion.current++;
      stopAudio();

      await playWithFallback(LETS_REVIEW_AUDIO.primary, LETS_REVIEW_AUDIO.fallback);
      if (cancelled) return;

      for (let i = 1; i <= MAX_N; i++) {
        if (cancelled) return;
        setHighlightIndex(i);
        await playWithFallback(stepData[i].audio3, stepData[i].audio1 || stepData[i].audio3);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Fish counting steps (with fallbacks for terminal _fish)
  useEffect(() => {
    if (step < COUNT_START || step > COUNT_END) return;
    let cancelled = false;
    setReviewFinished(false);
    setCurrentCount(0);
    setChallengeActive(false);

    const count = step - COUNT_START + 1;
    const audios = countingAudiosFor(count);

    const run = async () => {
      playVersion.current++;
      stopAudio();
      setFishSet(pickRandomFish(count));

      if (step === COUNT_START && !prefacePlayedRef.current) {
        prefacePlayedRef.current = true;
        await playWithFallback(COUNT_WITH_FISH_PREFACE.primary, COUNT_WITH_FISH_PREFACE.fallback);
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 500));
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }

      for (let i = 0; i < audios.length; i++) {
        if (cancelled) return;
        const k = i + 1;
        setHighlightIndex(k);
        setCurrentCount(k);

        const primary = audios[i];
        const baseWord = numberWord[k];
        // chained fallback: lesson3 -> lesson1 terminal/plain -> lesson1 plain
        const fallback1 = primary.endsWith("_fish.mp3")
          ? `/audio/lesson1/${baseWord}_fish.mp3`
          : `/audio/numbers/${baseWord}.mp3`;

        await playWithFallback(primary, fallback1);

        setHighlightIndex(null);
        if (i < audios.length - 1) await new Promise((r) => setTimeout(r, 800));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleChallengeClick = async (clickedIndex) => {
    if (!challengeActive || isAudioPlaying || roundComplete) return;

    if (clickedIndex === targetIndex) {
      const ac = challengeCorrectAudio(targetIndex);
      await playWithFallback(ac.primary, ac.fallback);
      setRoundComplete(true);
      setChallengeRounds((r) => r + 1);
      setReviewFinished(true);
    } else {
      await playWithFallback(challengeWrongAudio.primary, challengeWrongAudio.fallback);
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
    <section className="lesson-screen fixed inset-0 w-screen h-screen flex flex-col items-center justify-start overflow-hidden m-0 p-0">
      {/* Headers */}
      {step === REVIEW_STEP && (
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-md">Let's Review!</h1>
        </div>
      )}
      {step === COUNT_START && (
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-3xl font-bold drop-shadow-sm">Now let's count the monkeys!</h1>
        </div>
      )}

      {/* Content */}
      <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
        {step >= INTRO_START && step <= INTRO_END && (
          <div className="flex flex-col items-center -mt-2 gap-6">
            <h2 className="text-4xl sm:text-5xl font-bold">{stepData[step].title}</h2>
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
          </div>
        )}

        {/* Review row */}
        {step === REVIEW_STEP && (
          <div className="grid grid-cols-5 gap-6 sm:gap-10 justify-center items-center flex-wrap">
            {Array.from({ length: MAX_N }, (_, i) => i + 1).map((num) => (
              <motion.img
                key={num}
                src={stepData[num].img}
                alt={stepData[num].alt}
                className="max-w-[120px] sm:max-w-[140px] w-full"
                animate={{ scale: highlightIndex === num ? 1.35 : 1 }}
                transition={{ duration: 0.4 }}
              />
            ))}
          </div>
        )}

       {step >= COUNT_START && step <= COUNT_END && (
  <>
    {!challengeActive && (
      <div className="flex justify-center items-center w-full px-4 md:px-10 mt-4 gap-6">
        <div className="flex items-center justify-center gap-10 w-full max-w-[800px] mx-auto">
          <div className="flex flex-wrap justify-start gap-4 md:gap-6 flex-1">
            <AnimatePresence>
              {fishSet.slice(0, currentCount).map((src, idx) => (
                <motion.img
                  key={`${src}-${idx}`}
                  src={src}
                  alt="Fish"
                  className="w-[80px] sm:w-[100px] md:w-[120px] lg:w-[140px]"
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

          {currentCount > 0 && (
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <motion.img
                key={`num-${currentCount}-fish`}
                src={stepData[currentCount]?.img}
                alt={stepData[currentCount]?.alt}
                className="w-[120px] sm:w-[140px] md:w-[160px] lg:w-[220px]"
                style={{
                  filter:
                    "drop-shadow(0 10px 22px rgba(0,0,0,0.35)) drop-shadow(0 0 8px rgba(255,255,255,0.65))",
                }}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              <motion.span
                className="text-2xl sm:text-3xl md:text-4xl font-bold capitalize"
                animate={{ opacity: [0, 1], y: [8, 0] }}
                transition={{ duration: 0.35 }}
              >
                {numberWordsTitle[currentCount]}
              </motion.span>
            </div>
          )}
        </div>
      </div>
    )}

            {challengeActive && (
              <div className="flex flex-col items-center gap-6">
                <h3 className="text-2xl sm:text-3xl font-bold">
                  Click on monkey number {targetIndex}.
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
                      aria-label={`Fish number ${i + 1}`}
                    >
                      <motion.img
                        src={src}
                        alt={`Fish number ${i + 1}`}
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
        {/* Intro buttons */}
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
              (!challengeActive && (!reviewFinished || isAudioPlaying)) ||
              (challengeActive && (isAudioPlaying || (!roundComplete && challengeRounds > 0 && challengeRounds < MAX_CHALLENGE_ROUNDS)))
            }
            className={`px-6 py-3 text-lg rounded-lg transition ${
              (!challengeActive && (!reviewFinished || isAudioPlaying)) ||
              (challengeActive && (isAudioPlaying || (!roundComplete && challengeRounds > 0 && challengeRounds < MAX_CHALLENGE_ROUNDS)))
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            title={
              !challengeActive
                ? (!reviewFinished ? "Please finish listening first" : "Next")
                : (challengeRounds >= MAX_CHALLENGE_ROUNDS
                    ? "Continue"
                    : (roundComplete ? "Next Round" : "Finish this round first"))
            }
          >
            {!challengeActive
              ? "Next"
              : (challengeRounds >= MAX_CHALLENGE_ROUNDS
                  ? "Continue"
                  : (challengeRounds === 0
                      ? "Start"
                      : (roundComplete ? "Next Round" : "Next Round")))}
          </button>
        )}
      </div>
    </section>
  );
};

export default TeachScreen;
