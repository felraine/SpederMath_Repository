import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TeachScreen = ({ onNext }) => {
  const [step, setStep] = useState(1);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [reviewFinished, setReviewFinished] = useState(false);
  const [currentCount, setCurrentCount] = useState(0); // always visible

  // Step data (numbers and their assets)
  const stepData = {
    1: { title: "One", img: "/photos/number_pngs/number_1.png", alt: "Number 1", audio: "/audio/lesson1/one.mp3" },
    2: { title: "Two", img: "/photos/number_pngs/number_2.png", alt: "Number 2", audio: "/audio/lesson1/two.mp3" },
    3: { title: "Three", img: "/photos/number_pngs/number_3.png", alt: "Number 3", audio: "/audio/lesson1/three.mp3" },
  };

  // Apple counting audio
  const appleAudio = {
    1: ["/audio/lesson1/one_apples.mp3"],
    2: ["/audio/lesson1/one.mp3", "/audio/lesson1/two_apples.mp3"],
    3: ["/audio/lesson1/one.mp3", "/audio/lesson1/two.mp3", "/audio/lesson1/three_apples.mp3"],
  };

  // Balloon counting audio
  const balloonAudio = {
    1: ["/audio/lesson1/one_balloons.mp3"],
    2: ["/audio/lesson1/one.mp3", "/audio/lesson1/two_balloons.mp3"],
    3: ["/audio/lesson1/one.mp3", "/audio/lesson1/two.mp3", "/audio/lesson1/three_balloons.mp3"],
  };

  // Number words
  const numberWords = ["Zero", "One", "Two", "Three"];

  // Play audio whenever step changes (numbers only)
  useEffect(() => {
    if ((step > 3 && step < 5) || (step >= 5 && step <= 10)) return; // skip review/apples/balloons
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

  // Handle Next button
  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    } else if (step === 3) {
      setStep(4); // go to review
    } else if (step === 4) {
      setStep(5); // go to apples
    } else if (step >= 5 && step < 7) {
      setStep((prev) => prev + 1); // more apples
    } else if (step === 7) {
      setStep(8); // go to balloons
    } else if (step >= 8 && step < 10) {
      setStep((prev) => prev + 1); // more balloons
    } else {
      onNext(); // finish
    }
  };

  // ===== Review Step =====
  useEffect(() => {
    if (step !== 4) return;

    let i = 1;
    setReviewFinished(false);

    const playSequential = () => {
      if (i > 3) {
        setHighlightIndex(null);
        setReviewFinished(true);
        return;
      }

      setHighlightIndex(i);
      const audio = new Audio(stepData[i].audio);
      setIsAudioPlaying(true);
      audio.play();

      audio.onended = () => {
        setIsAudioPlaying(false);
        setHighlightIndex(null);
        i++;
        setTimeout(playSequential, 500);
      };
    };

    playSequential();
  }, [step]);

  // ===== Apple Counting Step =====
  useEffect(() => {
    if (step < 5 || step > 7) return;

    const count = step - 4;
    const audios = appleAudio[count];
    if (!audios) return;

    setReviewFinished(false);
    setCurrentCount(1);

    const startCounting = () => {
      let i = 0;
      const playSequential = () => {
        if (i >= audios.length) {
          setHighlightIndex(null);
          setReviewFinished(true);
          return;
        }

        setHighlightIndex(i + 1);
        setCurrentCount(i + 1);
        const audio = new Audio(audios[i]);
        setIsAudioPlaying(true);
        audio.play();

        audio.onended = () => {
          setIsAudioPlaying(false);
          setHighlightIndex(null);
          i++;
          setTimeout(playSequential, 500);
        };
      };

      playSequential();
    };

    if (count === 1) startCounting();
    else setTimeout(startCounting, 800);
  }, [step]);

  // ===== Balloon Counting Step =====
  useEffect(() => {
    if (step < 8 || step > 10) return;

    const count = step - 7;
    const audios = balloonAudio[count];
    if (!audios) return;

    setReviewFinished(false);
    setCurrentCount(1);

    const startCounting = () => {
      let i = 0;
      const playSequential = () => {
        if (i >= audios.length) {
          setHighlightIndex(null);
          setReviewFinished(true);
          return;
        }

        setHighlightIndex(i + 1);
        setCurrentCount(i + 1);
        const audio = new Audio(audios[i]);
        setIsAudioPlaying(true);
        audio.play();

        audio.onended = () => {
          setIsAudioPlaying(false);
          setHighlightIndex(null);
          i++;
          setTimeout(playSequential, 500);
        };
      };

      playSequential();
    };

    if (count === 1) startCounting();
    else setTimeout(startCounting, 800);
  }, [step]);

  return (
    <div className="flex flex-col items-center justify-between h-full">
      {/* Title (hidden for apples/balloons) */}
      <div className="h-16 flex items-center justify-center mt-6 mb-6">
        <h1 className="text-4xl">
          {step === 4
            ? "Let's Review!"
            : step <= 3
            ? stepData[step]?.title
            : ""}
        </h1>
      </div>

      {/* Content Area */}
      <div className="flex-grow flex flex-col items-center justify-center text-center w-full">
        {/* Numbers */}
        {step <= 3 && (
          <motion.img
            key={step}
            src={stepData[step].img}
            alt={stepData[step].alt}
            className="max-w-[160px] w-full"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}

        {/* Review */}
        {step === 4 && (
          <div className="flex flex-row gap-16 justify-center items-center">
            {Object.keys(stepData).map((num) => (
              <motion.img
                key={num}
                src={stepData[num].img}
                alt={stepData[num].alt}
                className="max-w-[120px] w-full"
                animate={{ scale: highlightIndex === parseInt(num) ? 1.5 : 1 }}
                transition={{ duration: 0.5 }}
              />
            ))}
          </div>
        )}

        {/* Apples + Number Display */}
        {step >= 5 && step <= 7 && (
          <div className="flex flex-row items-center justify-between w-full px-24 -mt-12">
            <div className="flex flex-row gap-16">
              <AnimatePresence>
                {Array.from({ length: step - 4 }).map((_, idx) => (
                  <motion.img
                    key={idx}
                    src="/photos/lesson1/apple.png"
                    alt="Apple"
                    className="w-[130px]"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                      opacity: 1,
                      scale: highlightIndex === idx + 1 ? 1.5 : 1,
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.5 }}
                  />
                ))}
              </AnimatePresence>
            </div>

            <div className="flex flex-col items-center mr-16">
              {currentCount > 0 && (
                <>
                  <motion.img
                    key={`num-${currentCount}-apple`}
                    src={stepData[currentCount]?.img}
                    alt={stepData[currentCount]?.alt}
                    className="w-[160px]"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  <motion.span
                    className="text-3xl capitalize mt-2"
                    animate={{ opacity: [0, 1], y: [10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    {numberWords[currentCount]}
                  </motion.span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Balloons + Number Display */}
        {step >= 8 && step <= 10 && (
          <div className="flex flex-row items-center justify-between w-full px-24 -mt-12">
            <div className="flex flex-row gap-16">
              <AnimatePresence>
                {Array.from({ length: step - 7 }).map((_, idx) => (
                  <motion.img
                    key={idx}
                    src="/photos/lesson1/red_balloon.png"
                    alt="Balloon"
                    className="w-[130px]"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                      opacity: 1,
                      scale: highlightIndex === idx + 1 ? 1.5 : 1,
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.5 }}
                  />
                ))}
              </AnimatePresence>
            </div>

            <div className="flex flex-col items-center mr-16">
              {currentCount > 0 && (
                <>
                  <motion.img
                    key={`num-${currentCount}-balloon`}
                    src={stepData[currentCount]?.img}
                    alt={stepData[currentCount]?.alt}
                    className="w-[160px]"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  <motion.span
                    className="text-3xl capitalize mt-2"
                    animate={{ opacity: [0, 1], y: [10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    {numberWords[currentCount]}
                  </motion.span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Button */}
      <div className="absolute bottom-6 right-6">
        {step <= 3 && (
          <button
            onClick={handleNext}
            disabled={isAudioPlaying}
            className={`px-6 py-3 text-lg rounded-lg transition ${
              isAudioPlaying
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
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
              !reviewFinished
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
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
              !reviewFinished
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
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
              !reviewFinished
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {step < 10 ? "Next" : "Continue"}
          </button>
        )}
      </div>
    </div>
  );
};

export default TeachScreen;
