import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../css/overlays.css";

const TeachScreen = ({ onNext }) => {
  const [step, setStep] = useState(1);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [reviewFinished, setReviewFinished] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);

  // Counting fish visuals for the left side in steps 5–7
  const [fishSet, setFishSet] = useState([]);

  // --- Challenge state (only after step 7) ---
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeFish, setChallengeFish] = useState([]); // exactly 3 fish
  const [targetIndex, setTargetIndex] = useState(1);      // 1,2,3 (positional)

  // NEW
  const MAX_CHALLENGE_ROUNDS = 3;
  const [challengeRounds, setChallengeRounds] = useState(0); // 0..3
  const [roundComplete, setRoundComplete] = useState(false); // NEW


  // Preface before step 5 counting
  const [prefacePlayed, setPrefacePlayed] = useState(false);

  const audioRef = useRef(null);
  const playVersion = useRef(0); // cancels stale sequences

  const stepData = {
    1: { title: "One",   img: "/photos/number_pngs/number_1.png", alt: "Number 1", audio: "/audio/numbers/one.mp3" },
    2: { title: "Two",   img: "/photos/number_pngs/number_2.png", alt: "Number 2", audio: "/audio/numbers/two.mp3" },
    3: { title: "Three", img: "/photos/number_pngs/number_3.png", alt: "Number 3", audio: "/audio/numbers/three.mp3" },
  };

  const FISH_IMAGES = [
    "/photos/lesson1/fish1.png",
    "/photos/lesson1/fish2.png",
    "/photos/lesson1/fish3.png",
    "/photos/lesson1/fish4.png",
  ];

  // Counting audio (fish)
  const fishAudio = {
    1: ["/audio/lesson1/one_fish.mp3"],
    2: ["/audio/numbers/one.mp3", "/audio/lesson1/two_fish.mp3"],
    3: ["/audio/numbers/one.mp3", "/audio/numbers/two.mp3", "/audio/lesson1/three_fish.mp3"],
  };

  // Challenge audios
  const challengePromptAudio = {
    1: "/audio/lesson1/click_one_fish.mp3",
    2: "/audio/lesson1/click_two_fish.mp3",
    3: "/audio/lesson1/click_three_fish.mp3",
  };
  const challengeCorrectAudio = {
    1: "/audio/lesson1/correct_fish_one.mp3",
    2: "/audio/lesson1/correct_fish_two.mp3",
    3: "/audio/lesson1/correct_fish_three.mp3",
  };
  const challengeWrongAudio = "/audio/lesson1/try_again.mp3";

  // Preface audios
  const COUNT_WITH_FISH_PREFACE = "/audio/lesson1/count_with_fish.mp3";
  const LETS_REVIEW_AUDIO = "/audio/lesson1/lets_review.mp3";

  const numberWords = ["Zero", "One", "Two", "Three"]; //erm zero?! hmmm

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
        a.play().catch(() => cleanup()); // if autoplay blocked, resolve
      } catch {
        setIsAudioPlaying(false);
        resolve();
      }
    });
  };

  // Intro numbers (steps 1–3): speak each number upon entering that step
  useEffect(() => {
    if (step > 3) return;
    const current = stepData[step];
    if (!current) return;
    playAudioAsync(current.audio);
  }, [step]);

  const startChallengeRound = async () => {
    setRoundComplete(false); 
    const challengeImgs = pickRandomFish(3);
    setChallengeFish(challengeImgs);

    const target = 1 + Math.floor(Math.random() * 3);
      setTargetIndex(target);

      setChallengeActive(true);
      setReviewFinished(false); // lock the button while the round is active
      await playAudioAsync(challengePromptAudio[target]); // "Click fish number X"
    };

  const handleNext = () => {
    if (step < 3) setStep((p) => p + 1);
    else if (step === 3) setStep(4);
    else if (step === 4) setStep(5);
    else if (step >= 5 && step < 7) setStep((p) => p + 1);
    else if (step === 7) {
      if (isAudioPlaying) return;

      if (challengeRounds < MAX_CHALLENGE_ROUNDS) {
        // If we haven't started any round OR the last round just finished,
        // start/advance to the next one.
        startChallengeRound();
      } else {
        // All rounds done -> leave challenge and proceed
        setChallengeActive(false);
        onNext();
      }
    }
  };

  // Review (step 4): play “Let’s review!” THEN begin the 1→2→3 review sequence
  useEffect(() => {
    if (step !== 4) return;
    let cancelled = false;
    setReviewFinished(false);

    const run = async () => {
      await playAudioAsync(LETS_REVIEW_AUDIO);
      if (cancelled) return;

      for (let i = 1; i <= 3; i++) {
        if (cancelled) return;
        setHighlightIndex(i);
        await playAudioAsync(stepData[i].audio);
        setHighlightIndex(null);
        if (i < 3) await new Promise((r) => setTimeout(r, 600));
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

  // Utility: pick N random fish images
  const pickRandomFish = (n) =>
    Array.from({ length: n }, () => FISH_IMAGES[Math.floor(Math.random() * FISH_IMAGES.length)]);

  // Fish counting (steps 5–7), with preface on step 5; challenge ONLY after step 7
  useEffect(() => {
    if (step < 5 || step > 7) return;
    let cancelled = false;
    setReviewFinished(false);
    setCurrentCount(0);
    setChallengeActive(false); // reset when entering any of 5–7

    const count = step - 4; // 1,2,3
    const audios = fishAudio[count] || [];

    const run = async () => {
      setFishSet(pickRandomFish(count));

      if (step === 5 && !prefacePlayed) {
        setPrefacePlayed(true);
        await playAudioAsync(COUNT_WITH_FISH_PREFACE);
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 500));
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }

      // Counting sequence
      for (let i = 0; i < audios.length; i++) {
        if (cancelled) return;
        setHighlightIndex(i + 1);
        setCurrentCount(i + 1);
        await playAudioAsync(audios[i]);
        setHighlightIndex(null);
        if (i < audios.length - 1) await new Promise((r) => setTimeout(r, 800));
      }
      if (cancelled) return;

      // After counting:
      if (step === 7) {
        // Do NOT start challenge automatically. Let the user press the button to start.
        setReviewFinished(true); // enable the button
      } else {
        setReviewFinished(true);
      }
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

  // Handle challenge clicks (exactly 3 fish; click correct positional index)
const handleChallengeClick = async (clickedIndex) => {
  if (!challengeActive || isAudioPlaying || roundComplete) return; // ignore extra clicks

  if (clickedIndex === targetIndex) {
    await playAudioAsync(challengeCorrectAudio[targetIndex]);
    setRoundComplete(true);              // NEW: round is finished
    setChallengeRounds((r) => r + 1);
    setReviewFinished(true);             // allow the bottom button
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

  return (
    <section className="lesson-screen relative w-full h-full flex flex-col items-center justify-start">
      {/* Headers */}
      {step === 4 && (
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-md">Let’s Review!</h1>
        </div>
      )}
      {step === 5 && (
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-3xl font-bold drop-shadow-sm">Now let’s count with our fish friends!</h1>
        </div>
      )}

      {/* Content */}
      <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
        {/* Intro numbers (1–3) */}
        {step <= 3 && (
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

        {/* Review row (step 4) */}
        {step === 4 && (
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 lg:gap-16">
          {Object.keys(stepData).map((num) => (
            <motion.img
              key={num}
              src={stepData[num].img}
              alt={stepData[num].alt}
              className="w-20 sm:w-24 md:w-28 lg:w-36 max-w-full"
              animate={{ scale: highlightIndex === parseInt(num) ? 1.35 : 1 }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>

        )}

        {/* Fish counting (5–7) OR challenge */}
        {step >= 5 && step <= 7 && (
          <>
            {!challengeActive && (
            <div className="flex justify-center items-center w-full px-4 md:px-10 mt-4 gap-6">
  {/* Invisible container to keep number in fixed place */}
  <div className="flex items-center justify-center gap-10 w-full max-w-[800px] mx-auto">
    
    {/* Fish Row */}
    <div className="flex flex-wrap justify-start gap-4 md:gap-6 flex-1">
      <AnimatePresence>
        {fishSet.slice(0, currentCount).map((src, idx) => (
          <motion.img
            key={`${src}-${idx}`}
            src={src}
            alt="Fish"
            className="w-[80px] sm:w-[100px] md:w-[120px] lg:w-[140px]"
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: highlightIndex === idx + 1 ? 1.3 : 1, y: 0 }}
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
              style={{ filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.35)) drop-shadow(0 0 8px rgba(255,255,255,0.65))" }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <motion.span
              className="text-2xl sm:text-3xl md:text-4xl font-bold capitalize"
              animate={{ opacity: [0, 1], y: [8, 0] }}
              transition={{ duration: 0.35 }}
            >
              {numberWords[currentCount]}
            </motion.span>
          </div>
        )}
      </div>
    </div>

            )}

            {challengeActive && (
             <div className="flex flex-col items-center gap-4 md:gap-6 mt-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-center">
              Click on <span className="underline">fish number {targetIndex}</span>.
            </h3>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8">
              {challengeFish.map((src, i) => (
                <motion.div
                  key={`${src}-challenge-${i}`}
                  className="relative w-[80px] sm:w-[100px] md:w-[120px] lg:w-[140px] cursor-pointer"
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
                  {/* Number overlay */}
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-2xl sm:text-3xl md:text-4xl font-extrabold drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
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
        {step <= 3 && (
          <button
            onClick={handleNext}
            disabled={isAudioPlaying}
            className={`px-6 py-3 text-lg rounded-lg transition ${
              isAudioPlaying ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
            }`}
            title={isAudioPlaying ? "Please listen first" : "Next"}
          >
            {step < 3 ? "Next" : "Review"}
          </button>
        )}

        {step === 4 && (
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

        {step >= 5 && step <= 7 && (
          <button
            onClick={handleNext}
            disabled={
              (step < 7 && (!reviewFinished || isAudioPlaying)) ||
              (step === 7 && (
                isAudioPlaying ||
                (!roundComplete && challengeRounds > 0 && challengeRounds < MAX_CHALLENGE_ROUNDS) // during a round
              ))
            }
            className={`px-6 py-3 text-lg rounded-lg transition ${
              (step < 7 && (!reviewFinished || isAudioPlaying)) ||
              (step === 7 && (isAudioPlaying || (!roundComplete && challengeRounds > 0 && challengeRounds < MAX_CHALLENGE_ROUNDS)))
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            title={
              step < 7
                ? (!reviewFinished ? "Please finish listening first" : "Next")
                : (challengeRounds >= MAX_CHALLENGE_ROUNDS
                    ? "Continue"
                    : (roundComplete ? "Start next round" : "Finish this round first"))
            }
          >
            {step < 7
              ? "Next"
              : (challengeRounds >= MAX_CHALLENGE_ROUNDS
                  ? "Continue"
                  : (challengeRounds === 0
                      ? "Start"
                      : (roundComplete ? "Next Round" : "Next Round"))) }
          </button>
        )}
      </div>
    </section>
  );
};

export default TeachScreen;
