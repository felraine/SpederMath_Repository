import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../css/overlays.css";

const TeachScreen = ({ onNext }) => {
  // ========== CONFIG ==========
  const MAX_N = 10;

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
  const [prefacePlayed, setPrefacePlayed] = useState(false);

  const audioRef = useRef(null);
  const playVersion = useRef(0); // cancels stale sequences

  // ====== Assets ======
  const stepData = {
    1: { title: "One",   img: "/photos/number_pngs/number_1.png", alt: "Number 1", audio: "/audio/numbers/one.mp3" },
    2: { title: "Two",   img: "/photos/number_pngs/number_2.png", alt: "Number 2", audio: "/audio/numbers/two.mp3" },
    3: { title: "Three", img: "/photos/number_pngs/number_3.png", alt: "Number 3", audio: "/audio/numbers/three.mp3" },
    4: { title: "Four",  img: "/photos/number_pngs/number_4.png", alt: "Number 4", audio: "/audio/numbers/four.mp3" },
    5: { title: "Five",  img: "/photos/number_pngs/number_5.png", alt: "Number 5", audio: "/audio/numbers/five.mp3" },
    6: { title: "Six",   img: "/photos/number_pngs/number_6.png", alt: "Number 6", audio: "/audio/numbers/six.mp3"},
    7: { title: "Seven", img: "/photos/number_pngs/number_7.png", alt: "Number 7", audio: "/audio/numbers/seven.mp3"},
    8: { title: "Eight", img: "/photos/number_pngs/number_8.png", alt: "Number 8", audio: "/audio/numbers/eight.mp3"},
    9: { title: "Nine",  img: "/photos/number_pngs/number_9.png", alt: "Number 9", audio: "/audio/numbers/nine.mp3"},
    10:{ title: "Ten",   img: "/photos/number_pngs/number_10.png",alt: "Number 10",audio: "/audio/numbers/ten.mp3"},
  };

  const numberWord = { 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten" };
  const numberWordsTitle = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

  // Build counting audio arrays dynamically (e.g., 1 fish ⇒ ["one_fish.mp3"], 4 fish ⇒ ["one.mp3","two.mp3","three.mp3","four_fish.mp3"])
  const countingAudiosFor = (n) =>
    Array.from({ length: n }, (_, i) => {
      const k = i + 1;
      return k === n
        ? `/audio/lesson1/${numberWord[k]}_fish.mp3`
        : `/audio/numbers/${numberWord[k]}.mp3`;
    });

  const FISH_IMAGES = [
    "/photos/lesson4/bird1.png",
    "/photos/lesson4/bird2.png",
    "/photos/lesson4/bird3.png",
    "/photos/lesson4/bird4.png",
  ];

  // Challenge audios (provide 4/5 when ready; we’ll fallback gracefully)
  const challengePromptAudio = (n) => `/audio/lesson1/click_${numberWord[n]}_fish.mp3`;
  const challengeCorrectAudio = (n) => `/audio/lesson1/correct_fish_${numberWord[n]}.mp3`;
  const challengeWrongAudio = "/audio/lesson1/try_again.mp3";

  const COUNT_WITH_FISH_PREFACE = "/audio/lesson1/count_with_fish.mp3";
  const LETS_REVIEW_AUDIO = "/audio/lesson1/lets_review.mp3";

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

  // Fallback wrapper: try primary, fallback to alt if missing
  const playWithFallback = (primary, fallback) =>
    new Promise((resolve) => {
      const a = new Audio(primary);
      audioRef.current = a;
      setIsAudioPlaying(true);

      const end = () => {
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

  // Intro numbers (steps 1..MAX_N): speak each number upon entering that step
  useEffect(() => {
    if (step < INTRO_START || step > INTRO_END) return;
    const current = stepData[step];
    if (!current) return;
    playAudioAsync(current.audio);
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

    // Prompt with fallback to just the number audio if the specific prompt isn’t available yet
    await playWithFallback(challengePromptAudio(target), stepData[target].audio);
  };

  const handleNext = () => {
    // Intro pages
    if (step < INTRO_END) return setStep((p) => p + 1);

    // Move from last intro to review
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
      await playAudioAsync(LETS_REVIEW_AUDIO);
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

  // Fish counting steps
  useEffect(() => {
    if (step < COUNT_START || step > COUNT_END) return;
    let cancelled = false;
    setReviewFinished(false);
    setCurrentCount(0);
    setChallengeActive(false); // reset on any counting step

    // Which count is this step demonstrating? (1..MAX_N)
    const count = step - COUNT_START + 1;
    const audios = countingAudiosFor(count);

    const run = async () => {
      setFishSet(pickRandomFish(count));

      if (step === COUNT_START && !prefacePlayed) {
        setPrefacePlayed(true);
        await playAudioAsync(COUNT_WITH_FISH_PREFACE);
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

        // For the terminal clip like "four_fish.mp3", fallback to "four.mp3" if missing
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

  // Handle challenge clicks (exactly MAX_N fish; click correct positional index)
  const handleChallengeClick = async (clickedIndex) => {
    if (!challengeActive || isAudioPlaying || roundComplete) return;

    if (clickedIndex === targetIndex) {
      // Correct sfx with fallback to plain number
      await playWithFallback(challengeCorrectAudio(targetIndex), stepData[targetIndex].audio);
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
      {step === REVIEW_STEP && (
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-md">Let’s Review!</h1>
        </div>
      )}
      {step === COUNT_START && (
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-3xl font-bold drop-shadow-[0_4px_3px_rgba(0,0,0,0.6)]">Now let’s count the birds!</h1>
        </div>
      )}

      {/* Content */}
      <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
        {/* Intro numbers (1–MAX_N) */}
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
                <img
                  src="/photos/number_pngs/number_1.png"
                  alt="Number 1"
                  className="h-[150px] sm:h-[190px] md:h-[230px] object-contain"
                  draggable={false}
                />
                <img
                  src="/photos/number_pngs/number_0.png"
                  alt="Number 0"
                  className="h-[150px] sm:h-[190px] md:h-[230px] object-contain"
                  draggable={false}
                />
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

      {/* Review row */}
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
                    <img
                      src="/photos/number_pngs/number_1.png"
                      alt="Number 1"
                      className="h-[120px] sm:h-[140px] md:h-[160px] object-contain"
                      draggable={false}
                    />
                    <img
                      src="/photos/number_pngs/number_0.png"
                      alt="Number 0"
                      className="h-[120px] sm:h-[140px] md:h-[160px] object-contain"
                      draggable={false}
                    />
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
                          <img
                            src="/photos/number_pngs/number_1.png"
                            alt="Number 1"
                            className="h-[170px] sm:h-[200px] md:h-[220px] object-contain"
                            draggable={false}
                          />
                          <img
                            src="/photos/number_pngs/number_0.png"
                            alt="Number 0"
                            className="h-[170px] sm:h-[200px] md:h-[220px] object-contain"
                            draggable={false}
                          />
                        </motion.div>
                      ) : (
                        <motion.img
                          key={`num-${currentCount}-fish`}
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
      <div className="absolute bottom-2 right-6">
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
              // During counting: wait for audio
              (!challengeActive && (!reviewFinished || isAudioPlaying)) ||
              // During challenge: wait until a round is complete
              (challengeActive && (
                isAudioPlaying ||
                (!roundComplete && challengeRounds > 0 && challengeRounds < MAX_CHALLENGE_ROUNDS)
              ))
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
                    : (roundComplete ? "Start next round" : "Finish this round first"))
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
