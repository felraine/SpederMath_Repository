// src/lessons/lesson3/TeachScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../css/overlays.css";

const TeachScreen = ({ onNext, meta }) => {
  // ========== CONFIG ==========
  const MAX_N = 7;

  // Prelude: summarize 1–5 (review-style) before introducing 6 & 7
  const PRELUDE = 0;

  // Intro now starts at 6 and ends at 7 (so 1–5 aren’t repeated one-by-one)
  const INTRO_START = 6;
  const INTRO_END = 7;

  const REVIEW_STEP = MAX_N + 1;
  const COUNT_START = REVIEW_STEP + 1;
  const COUNT_END = COUNT_START + MAX_N - 1;

  const [step, setStep] = useState(PRELUDE);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [reviewFinished, setReviewFinished] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);

  // Counting visuals
  const [fishSet, setFishSet] = useState([]);

  // --- Challenge state (after COUNT_END) ---
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeFish, setChallengeFish] = useState([]); // exactly MAX_N items
  const [targetIndex, setTargetIndex] = useState(1);       // 1..MAX_N positional

  const MAX_CHALLENGE_ROUNDS = 5;
  const [challengeRounds, setChallengeRounds] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const [remainingTargets, setRemainingTargets] = useState([
    6, 7, ...[1,2,3,4,5].sort(() => Math.random() - 1/2)
  ]);

  // Preface before first counting step
  const [prefacePlayed, setPrefacePlayed] = useState(false);

  // Prelude control
  const [preludeFinished, setPreludeFinished] = useState(false);

  const audioRef = useRef(null);
  const playVersion = useRef(0); // cancels stale sequences

  // ====== Assets ======
  const stepData = {
    1: { title: "One",   img: "/photos/number_pngs/number_1.png", alt: "Number 1", audio: "/audio/numbers/one.mp3" },
    2: { title: "Two",   img: "/photos/number_pngs/number_2.png", alt: "Number 2", audio: "/audio/numbers/two.mp3" },
    3: { title: "Three", img: "/photos/number_pngs/number_3.png", alt: "Number 3", audio: "/audio/numbers/three.mp3" },
    4: { title: "Four",  img: "/photos/number_pngs/number_4.png", alt: "Number 4", audio: "/audio/numbers/four.mp3" },
    5: { title: "Five",  img: "/photos/number_pngs/number_5.png", alt: "Number 5", audio: "/audio/numbers/five.mp3" },
    6: { title: "Six",   img: "/photos/number_pngs/number_6.png", alt: "Number 6", audio: "/audio/numbers/six.mp3" },
    7: { title: "Seven", img: "/photos/number_pngs/number_7.png", alt: "Number 7", audio: "/audio/numbers/seven.mp3" },
  };

  const numberWord = { 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven" };
  const numberWordsTitle = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven"];

  // Build counting audio arrays dynamically; prefer lesson3 terminal "_fish" then fall back to plain number
  const countingAudiosFor = (n) =>
    Array.from({ length: n }, (_, i) => {
      const k = i + 1;
      const w = numberWord[k];
      return k === n ? `/audio/lesson3/${w}_monkey.mp3` : `/audio/numbers/${w}.mp3`;
    });

  // Monkeys as your L3 art
  const FISH_IMAGES = ["/photos/lesson3/monkey.png"];

  // Challenge audios (fallback to just the number if specific prompt isn’t available)
  const challengePromptAudio = (n) => `/audio/lesson3/click_${numberWord[n]}_monkey.mp3`;
  const challengeCorrectAudio = (n) => `/audio/lesson3/correct_monkey_${numberWord[n]}.mp3`;
  const challengeWrongAudio = "/audio/lesson1/try_again.mp3";

  const LETS_REVIEW_AUDIO       = ["/audio/lesson3/lets_review.mp3", "/audio/lesson1/lets_review.mp3"];

  // Your prelude VO parts (generic files; we’ll reuse L2’s pattern)
  const VO_NOW_THAT = "/audio/numbers/now_that_youve_learned_numbers.mp3";
  const VO_AFTER_GENERIC = "/audio/numbers/lets_introduce_numbers_after.mp3"; // generic line “after …”

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

  // ====== Prelude (multi-mp3) for 1–5 with emphasis grow ======
  useEffect(() => {
    if (step !== PRELUDE) return;

    let cancelled = false;
    setPreludeFinished(false);
    setHighlightIndex(null);

    const run = async () => {
      // small delay to ensure autoplay works properly
      await new Promise((r) => setTimeout(r, 400));

      // 1) “Now that you’ve learned numbers ...”
      await playAudioAsync(VO_NOW_THAT);
      if (cancelled) return;

      // 2) one → two → three → four → five (each number grows while its mp3 plays)
      for (let i = 1; i <= 5; i++) {
        if (cancelled) return;
        setHighlightIndex(i);
        await playAudioAsync(stepData[i].audio);
        if (cancelled) return;
        setHighlightIndex(null);
        if (i < 5) await new Promise((r) => setTimeout(r, 300));
      }

      // 3) “Let’s introduce you to numbers that come after…” then reinforce FIVE
      if (cancelled) return;
      await playAudioAsync(VO_AFTER_GENERIC);
      if (cancelled) return;

      setHighlightIndex(5);
      await playAudioAsync(stepData[5].audio);
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

  // Intro numbers (6–7): speak each number upon entering that step
  useEffect(() => {
    if (step < INTRO_START || step > INTRO_END) return;
    const current = stepData[step];
    if (!current) return;
    playAudioAsync(current.audio);
  }, [step]);

  // Start challenge round with non-repeating target pool
  const startChallengeRound = async () => {
    setRoundComplete(false);

    // refill when exhausted
    if (remainingTargets.length === 0) {
      setRemainingTargets([1,2,3,4,5,6,7]);
    }

    const randomIndex = Math.floor(Math.random() * remainingTargets.length);
    const target = remainingTargets[randomIndex];
    setRemainingTargets(remainingTargets.filter((_, i) => i !== randomIndex));

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
    // From Prelude -> first intro step (6)
    if (step === PRELUDE) return setStep(INTRO_START);

    // Intro pages (6 -> 7)
    if (step >= INTRO_START && step < INTRO_END) return setStep((p) => p + 1);

    // Move from last intro (7) to review
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

  // Review: play “Let’s review!” THEN 1→MAX_N sequence
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

  // Counting steps (1..7)
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
        if (cancelled) return;
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
          primary.endsWith("_fish.mp3")
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

  // Convert number index to word
  const numberWordMap = ["zero","one","two","three","four","five","six","seven"];
  const targetWord =
    targetIndex <= 7 ? numberWordMap[targetIndex] : targetIndex.toString();

  // ======= UI =======
  return (
    <section className="lesson-screen relative w-full h-full flex flex-col items-center justify-start">
      {/* Headers */}
      {step === PRELUDE && (
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">
            Quick Review: 1 to 5
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
          <h1 className="text-3xl font-bold drop-shadow-sm">Now let’s count the monkeys!</h1>
        </div>
      )}

      {/* Content */}
      <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
        {/* Prelude (review-style row for 1–5 with grow on each mp3) */}
        {step === PRELUDE && (
          <div className="flex flex-row gap-6 sm:gap-10 justify-center items-center flex-wrap mt-2">
            {[1, 2, 3, 4, 5].map((num) => (
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

        {/* Intro numbers (6–7) */}
        {step >= INTRO_START && step <= INTRO_END && (
          <div className="flex flex-col items-center -mt-2 gap-6">
            <h2 className="text-4xl sm:text-5xl font-bold">{stepData[step].title}</h2>
            <motion.img
              key={step}
              src={stepData[step].img}
              alt={stepData[step].alt}
              className="w-[150px] sm:w-[190px] md:w-[230px]"
              style={{
                filter:
                  "drop-shadow(0 8px 18px rgba(0,0,0,0.35)) drop-shadow(0 0 6px rgba(255,255,255,0.6))",
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        )}

        {/* Review row (1–7) */}
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

        {/* Counting OR Challenge */}
        {step >= COUNT_START && step <= COUNT_END && (
          <>
            {!challengeActive && (
              <div className="flex justify-center items-center w-full px-4 md:px-10 mt-4 gap-6">
                <div className="flex items-center justify-center gap-10 w-full max-w-[800px] mx-auto">
                  {/* Monkey Row */}
                  <div className="flex flex-wrap justify-start gap-4 md:gap-6 flex-1">
                    <AnimatePresence>
                      {fishSet.slice(0, currentCount).map((src, idx) => (
                        <motion.img
                          key={`${src}-${idx}`}
                          src={src}
                          alt="Monkey"
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

                  {/* Number Image + Text fixed position */}
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
                        transition={{ duration: 0.5, ease: "easeOut" }}
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
                  Click on monkey number {targetWord}.
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
                      aria-label={`Monkey number ${i + 1}`}
                    >
                      <motion.img
                        src={src}
                        alt={`Monkey number ${i + 1}`}
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
              !preludeFinished
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            title={!preludeFinished ? "Please listen first" : "Next"}
          >
            Next
          </button>
        )}

        {/* Intro buttons (6–7) */}
        {step >= INTRO_START && step <= INTRO_END && (
          <button
            onClick={handleNext}
            disabled={isAudioPlaying}
            className={`px-6 py-3 text-lg rounded-lg transition ${
              isAudioPlaying
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
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
              !reviewFinished
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
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
