import React, { useEffect, useState, useRef } from "react";
import "../../css/overlays.css";

const PracticeScreenUnified = ({ onNext, rounds = 3, sequence }) => {
  const resolvedSequence =
    Array.isArray(sequence) && sequence.length > 0
      ? sequence
      : Array.from({ length: rounds }, (_, i) => (i === rounds - 1 ? "balloon" : "apple"));

  const [roundIndex, setRoundIndex] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState(1);
  const [selected, setSelected] = useState(null);
  const [isCounting, setIsCounting] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState([1, 2, 3]);
  const [showChoices, setShowChoices] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const activeAudio = useRef(null);

  const numberAudioMap = { 1: "one", 2: "two", 3: "three" };
  const correctAudios = ["/audio/lesson1/correct/good_job.mp3", "/audio/lesson1/correct/nice_work.mp3"];
  const wrongAudios = ["/audio/lesson1/wrong/good_attempt.mp3", "/audio/lesson1/wrong/nice_try.mp3"];

  const mode = resolvedSequence[roundIndex] ?? "apple";
  const labelPlural = mode === "balloon" ? "balloons" : "apples";
  const objectImg = mode === "balloon" ? "/photos/lesson1/red_balloon.png" : "/photos/lesson1/apple.png";
  const howManyAudio =
    mode === "balloon" ? "/audio/lesson1/how_many_balloons.mp3" : "/audio/lesson1/how_many_apples.mp3";

  const shuffleArray = (array) =>
    array.map((value) => ({ value, sort: Math.random() })).sort((a, b) => a.sort - b.sort).map(({ value }) => value);

  const playRandomAudio = (audioList, callback) => {
    const randomFile = audioList[Math.floor(Math.random() * audioList.length)];
    const audio = new Audio(randomFile);
    activeAudio.current = audio;
    audio.play();
    if (callback) audio.onended = callback;
  };

  useEffect(() => {
    startNewRound();
    return () => {
      if (activeAudio.current) {
        activeAudio.current.pause();
        activeAudio.current.currentTime = 0;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex]);

  const startNewRound = () => {
    const randomCount = Math.floor(Math.random() * 3) + 1;
    setCorrectAnswer(randomCount);
    setShuffledAnswers(shuffleArray([1, 2, 3]));
    setSelected(null);
    setIsCounting(false);
    setShowChoices(false);
    setHighlightIndex(-1);

    const q1 = new Audio(howManyAudio);
    activeAudio.current = q1;
    q1.play();
    q1.onended = () => {
      const q2 = new Audio("/audio/lesson1/lets_count.mp3");
      activeAudio.current = q2;
      q2.play();
      q2.onended = () => setShowChoices(true);
    };
  };

  const handleAnswer = (num) => {
    if (isCounting) return;
    setSelected(num);
    setIsCounting(true);
    let i = 1;

    const playNextNumber = () => {
      if (i <= num) {
        const terminalSuffix = mode === "balloon" ? "_balloons" : "_apples";
        const file = i === num ? `/audio/lesson1/${numberAudioMap[i]}${terminalSuffix}.mp3`
                               : `/audio/lesson1/${numberAudioMap[i]}.mp3`;
        const audio = new Audio(file);
        activeAudio.current = audio;
        setHighlightIndex(i - 1);
        audio.play();
        audio.onended = () => { setTimeout(() => { i++; playNextNumber(); }, 600); };
      } else {
        setTimeout(() => {
          if (num === correctAnswer) {
            playRandomAudio(correctAudios, () => setTimeout(() => advanceRound(), 700));
          } else {
            playRandomAudio(wrongAudios, () => setTimeout(() => { setIsCounting(false); setHighlightIndex(-1); }, 600));
          }
        }, 400);
      }
    };

    playNextNumber();
  };

  const advanceRound = () => {
    const isLast = roundIndex >= resolvedSequence.length - 1;
    if (isLast) onNext?.();
    else setRoundIndex((i) => i + 1);
  };

  const progressText = `${roundIndex + 1}/${resolvedSequence.length}`;

  return (
    <section className="lesson-screen">
      <div style={{ marginBottom: 10, opacity: 0.85, fontWeight: 700 }}>Practice {progressText}</div>

      <h2 style={{ fontSize: "28px", marginBottom: "20px", color: "#fff" }}>
        How many {labelPlural} do you see?
      </h2>

      <div style={{ display: "flex", justifyContent: "center", gap: "30px", margin: "30px 0" }}>
        {[...Array(correctAnswer)].map((_, i) => (
          <img
            key={i}
            src={objectImg}
            alt={labelPlural}
            style={{
              width: mode === "balloon" ? "80px" : "100px",
              transition: "transform 0.4s ease, filter 0.4s ease",
              transform: highlightIndex === i ? "scale(1.4)" : "scale(1)",
              filter: highlightIndex === i
                ? "drop-shadow(0px 0px 10px gold)"
                : "drop-shadow(0px 0px 5px rgba(0,0,0,0.2))",
            }}
          />
        ))}
      </div>

      {showChoices && (
        <div style={{ display: "flex", justifyContent: "center", gap: "40px", marginTop: "20px" }}>
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
                  selected === num ? (num === correctAnswer ? "#4CAF50" : "#F44336") : "rgba(0,0,0,0.25)",
                color: "#fff",
                cursor: isCounting ? "not-allowed" : "pointer",
                boxShadow: "0 6px 12px rgba(0,0,0,0.28)",
                transition: "transform 0.2s ease, background-color 0.3s ease",
                transform: selected === num ? "scale(1.08)" : "scale(1)",
                opacity: isCounting && selected !== num ? 0.7 : 1,
              }}
              disabled={isCounting}
              onMouseEnter={(e) => { if (!isCounting) e.currentTarget.style.transform = "scale(1.1)"; }}
              onMouseLeave={(e) => { if (!isCounting) e.currentTarget.style.transform = selected === num ? "scale(1.08)" : "scale(1)"; }}
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
