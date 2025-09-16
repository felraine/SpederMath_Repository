import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../../css/overlays.css";

const TeachScreen = ({ onNext }) => {
  const [step, setStep] = useState(1);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [reviewFinished, setReviewFinished] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);

  const stepData = {
    1: { title: "One", img: "/photos/number_pngs/number_1.png", alt: "Number 1", audio: "/audio/lesson1/one.mp3" },
    2: { title: "Two", img: "/photos/number_pngs/number_2.png", alt: "Number 2", audio: "/audio/lesson1/two.mp3" },
    3: { title: "Three", img: "/photos/number_pngs/number_3.png", alt: "Number 3", audio: "/audio/lesson1/three.mp3" },
  };

  const appleAudio = {
    1: ["/audio/lesson1/one_apples.mp3"],
    2: ["/audio/lesson1/one.mp3", "/audio/lesson1/two_apples.mp3"],
    3: ["/audio/lesson1/one.mp3", "/audio/lesson1/two.mp3", "/audio/lesson1/three_apples.mp3"],
  };

  const balloonAudio = {
    1: ["/audio/lesson1/one_balloons.mp3"],
    2: ["/audio/lesson1/one.mp3", "/audio/lesson1/two_balloons.mp3"],
    3: ["/audio/lesson1/one.mp3", "/audio/lesson1/two.mp3", "/audio/lesson1/three_balloons.mp3"],
  };

  const numberWords = ["Zero", "One", "Two", "Three"];

  useEffect(() => {
    if ((step > 3 && step < 5) || (step >= 5 && step <= 10)) return;
    const current = stepData[step];
    if (!current) return;
    const audio = new Audio(current.audio);
    setIsAudioPlaying(true);
    audio.play();
    audio.onended = () => setIsAudioPlaying(false);
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [step]);

  const handleNext = () => {
    if (step < 3) setStep((p) => p + 1);
    else if (step === 3) setStep(4);
    else if (step === 4) setStep(5);
    else if (step >= 5 && step < 7) setStep((p) => p + 1);
    else if (step === 7) setStep(8);
    else if (step >= 8 && step < 10) setStep((p) => p + 1);
    else onNext();
  };

  // review sequence
  useEffect(() => {
    if (step !== 4) return;
    let i = 1;
    setReviewFinished(false);
    const playSequential = () => {
      if (i > 3) { setHighlightIndex(null); setReviewFinished(true); return; }
      setHighlightIndex(i);
      const audio = new Audio(stepData[i].audio);
      setIsAudioPlaying(true);
      audio.play();
      audio.onended = () => {
        setIsAudioPlaying(false);
        setHighlightIndex(null);
        i++;
        setTimeout(playSequential, 400);
      };
    };
    playSequential();
  }, [step]);

  // apples
  useEffect(() => {
    if (step < 5 || step > 7) return;
    const count = step - 4;
    const audios = appleAudio[count];
    if (!audios) return;
    setReviewFinished(false);
    setCurrentCount(1);

    const start = () => {
      let i = 0;
      const seq = () => {
        if (i >= audios.length) { setHighlightIndex(null); setReviewFinished(true); return; }
        setHighlightIndex(i + 1);
        setCurrentCount(i + 1);
        const audio = new Audio(audios[i]);
        setIsAudioPlaying(true);
        audio.play();
        audio.onended = () => {
          setIsAudioPlaying(false);
          setHighlightIndex(null);
          i++;
          setTimeout(seq, 400);
        };
      };
      seq();
    };
    if (count === 1) start(); else setTimeout(start, 600);
  }, [step]);

  // balloons
  useEffect(() => {
    if (step < 8 || step > 10) return;
    const count = step - 7;
    const audios = balloonAudio[count];
    if (!audios) return;
    setReviewFinished(false);
    setCurrentCount(1);

    const start = () => {
      let i = 0;
      const seq = () => {
        if (i >= audios.length) { setHighlightIndex(null); setReviewFinished(true); return; }
        setHighlightIndex(i + 1);
        setCurrentCount(i + 1);
        const audio = new Audio(audios[i]);
        setIsAudioPlaying(true);
        audio.play();
        audio.onended = () => {
          setIsAudioPlaying(false);
          setHighlightIndex(null);
          i++;
          setTimeout(seq, 400);
        };
      };
      seq();
    };
    if (count === 1) start(); else setTimeout(start, 600);
  }, [step]);

  return (
    <section className="lesson-screen relative w-full h-full flex flex-col items-center justify-start">
      {/* Header: keep only for review so 1–3 can pair word+number tightly */}
      {step === 4 ? (
        <div className="flex items-center justify-center mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-md">Let’s Review!</h1>
        </div>
      ) : (
        <div className="h-2" />
      )}

      {/* Content */}
      <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
        {/* 1–3: word + BIG number together, with a bold glow */}
        {step <= 3 && (
          <div className="flex flex-col items-center -mt-2 gap-6">
            {/* Bigger word text */}
            <h2 className="text-4xl sm:text-5xl font-bold">{stepData[step].title}</h2>

            {/* Slightly smaller number image */}
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
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        )}

        {/* Review row */}
        {step === 4 && (
          <div className="flex flex-row gap-12 justify-center items-center">
            {Object.keys(stepData).map((num) => (
              <motion.img
                key={num}
                src={stepData[num].img}
                alt={stepData[num].alt}
                className="max-w-[140px] w-full"
                animate={{ scale: highlightIndex === parseInt(num) ? 1.35 : 1 }}
                transition={{ duration: 0.4 }}
              />
            ))}
          </div>
        )}

        {/* Apples: smaller number image + bigger word */}
        {step >= 5 && step <= 7 && (
          <div className="flex flex-row items-center justify-between w-full px-10 -mt-1">
            <div className="flex flex-row gap-10">
              <AnimatePresence>
                {Array.from({ length: step - 4 }).map((_, idx) => (
                  <motion.img
                    key={idx}
                    src="/photos/lesson1/apple.png"
                    alt="Apple"
                    className="w-[110px] sm:w-[120px] md:w-[140px]"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: highlightIndex === idx + 1 ? 1.3 : 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.4 }}
                  />
                ))}
              </AnimatePresence>
            </div>

            <div className="flex flex-col items-center mr-8">
              {currentCount > 0 && (
                <>
                  {/* Reduced number image width */}
                  <motion.img
                    key={`num-${currentCount}-apple`}
                    src={stepData[currentCount]?.img}
                    alt={stepData[currentCount]?.alt}
                    className="w-[180px] sm:w-[200px] md:w-[220px]"
                    style={{ filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.35)) drop-shadow(0 0 8px rgba(255,255,255,0.65))" }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  {/* Bigger word label */}
                  <motion.span
                    className="text-3xl sm:text-4xl font-bold capitalize mt-1"
                    animate={{ opacity: [0, 1], y: [8, 0] }}
                    transition={{ duration: 0.35 }}
                  >
                    {numberWords[currentCount]}
                  </motion.span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Balloons: smaller number image + bigger word */}
        {step >= 8 && step <= 10 && (
          <div className="flex flex-row items-center justify-between w-full px-10 -mt-1">
            <div className="flex flex-row gap-10">
              <AnimatePresence>
                {Array.from({ length: step - 7 }).map((_, idx) => (
                  <motion.img
                    key={idx}
                    src="/photos/lesson1/red_balloon.png"
                    alt="Balloon"
                    className="w-[100px] sm:w-[110px] md:w-[130px]"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: highlightIndex === idx + 1 ? 1.3 : 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.4 }}
                  />
                ))}
              </AnimatePresence>
            </div>

            <div className="flex flex-col items-center mr-8">
              {currentCount > 0 && (
                <>
                  {/* Reduced number image width */}
                  <motion.img
                    key={`num-${currentCount}-balloon`}
                    src={stepData[currentCount]?.img}
                    alt={stepData[currentCount]?.alt}
                    className="w-[180px] sm:w-[200px] md:w-[220px]"
                    style={{ filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.35)) drop-shadow(0 0 8px rgba(255,255,255,0.65))" }}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  {/* Bigger word label */}
                  <motion.span
                    className="text-3xl sm:text-4xl font-bold capitalize mt-1"
                    animate={{ opacity: [0, 1], y: [8, 0] }}
                    transition={{ duration: 0.35 }}
                  >
                    {numberWords[currentCount]}
                  </motion.span>
                </>
              )}
            </div>
          </div>
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
          >
            Apples
          </button>
        )}

        {step >= 5 && step <= 7 && (
          <button
            onClick={handleNext}
            disabled={!reviewFinished}
            className={`px-6 py-3 text-lg rounded-lg transition ${
              !reviewFinished ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {step < 7 ? "Next" : "Balloons"}
          </button>
        )}

        {step >= 8 && (
          <button
            onClick={handleNext}
            disabled={!reviewFinished}
            className={`px-6 py-3 text-lg rounded-lg transition ${
              !reviewFinished ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {step < 10 ? "Next" : "Continue"}
          </button>
        )}
      </div>
    </section>
  );
};

export default TeachScreen;
