import React, { useEffect, useState, useRef } from "react";

const numberAudioMap = { 1: "one", 2: "two", 3: "three" };

const correctAudios = [
  "/audio/lesson1/correct/good_job.mp3",
  "/audio/lesson1/correct/nice_work.mp3",
];

const wrongAudios = [
  "/audio/lesson1/wrong/good_attempt.mp3",
  "/audio/lesson1/wrong/nice_try.mp3",
];

// Theme colors for tiles
const oceanTheme = {
  tile: "rgba(0, 95, 160, 0.35)",
  tileHover: "rgba(0, 95, 160, 0.5)",
  tileCorrect: "linear-gradient(145deg, #37d67a, #1aa35b)",
  tileWrong: "linear-gradient(145deg, #ff6b6b, #c81e1e)",
  textShadow: "2px 3px 8px rgba(0,0,0,0.35)",
  panel: "rgba(0, 40, 85, 0.22)",
};

const AssessmentMain = ({ onFinish }) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionType, setQuestionType] = useState("apple");
  const [correctAnswer, setCorrectAnswer] = useState(1);
  const [selected, setSelected] = useState(null);
  const [isCounting, setIsCounting] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showChoices, setShowChoices] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const activeAudio = useRef(null);

  useEffect(() => {
    startNewRound();
    return () => {
      if (activeAudio.current) {
        activeAudio.current.pause();
        activeAudio.current.currentTime = 0;
      }
    };
  }, [questionIndex]);

  const shuffleArray = (array) =>
    array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

  const playRandomAudio = (audioList, callback) => {
    const randomFile = audioList[Math.floor(Math.random() * audioList.length)];
    const audio = new Audio(randomFile);
    activeAudio.current = audio;
    audio.play();
    if (callback) audio.onended = callback;
  };

  const startNewRound = () => {
    const randomCount = Math.floor(Math.random() * 3) + 1; // 1–3
    const randomType = Math.random() > 0.5 ? "apple" : "balloon";

    setQuestionType(randomType);
    setCorrectAnswer(randomCount);
    setShuffledAnswers(shuffleArray([1, 2, 3]));
    setSelected(null);
    setIsCounting(false);
    setHighlightIndex(-1);
    setShowChoices(false);

    const audioFile =
      randomType === "apple"
        ? "/audio/lesson1/how_many_apples.mp3"
        : "/audio/lesson1/how_many_balloons.mp3";

    const qAudio = new Audio(audioFile);
    activeAudio.current = qAudio;
    qAudio.play().catch(() => setShowChoices(true));
    qAudio.onended = () => setShowChoices(true);
  };

  const handleAnswer = (num) => {
    setSelected(num);
    setIsCounting(true);
    let i = 1;

    const playNextNumber = () => {
      if (i <= correctAnswer) {
        const file =
          i === correctAnswer
            ? `/audio/lesson1/${numberAudioMap[i]}_${questionType}s.mp3`
            : `/audio/lesson1/${numberAudioMap[i]}.mp3`;

        const audio = new Audio(file);
        activeAudio.current = audio;
        setHighlightIndex(i - 1);
        audio.play();

        audio.onended = () => {
          setTimeout(() => {
            i++;
            playNextNumber();
          }, 500);
        };
      } else {
        setTimeout(() => {
          if (num === correctAnswer) {
            setScore((prev) => prev + 1);
            playRandomAudio(correctAudios, () => nextQuestion());
          } else {
            playRandomAudio(wrongAudios, () => nextQuestion());
          }
        }, 400);
      }
    };

    playNextNumber();
  };

  const nextQuestion = () => {
    if (questionIndex < 9) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      onFinish(score);
    }
  };

  const niceType = questionType === "apple" ? "apples" : "balloons";

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start p-6" style={{ color: "#f5faff" }}>
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-4 left-4"
      >
        <img
          src="/Back%20Button.png"
          alt="Back"
          className="w-10 h-10 object-contain"
        />
      </button>

      {/* Top banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "10px 18px",
          background: oceanTheme.panel,
          borderRadius: 999,
          backdropFilter: "blur(4px)",
          boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
          marginBottom: 18,
          fontWeight: 700,
          textShadow: oceanTheme.textShadow,
        }}
      >
        <span role="img" aria-label="quiz">🧠</span>
        <span>
          Question {questionIndex + 1} <span style={{ opacity: 0.8 }}>/ 10</span>
        </span>
        <span style={{ width: 1, height: 22, background: "rgba(255,255,255,0.35)" }} />
        <span role="img" aria-label="score">⭐</span>
        <span>Score: {score}</span>
      </div>

      {/* Main prompt (moved lower with margin) */}
      <h2
        style={{
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: 0.5,
          margin: "40px 0 20px", // pushed down
          textShadow: oceanTheme.textShadow,
        }}
      >
        Let’s count the {niceType}!
      </h2>

      {/* Objects (bigger apples/balloons) */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 32,
          margin: "20px 0 30px", // extra spacing before choices
          flexWrap: "wrap",
        }}
      >
        {[...Array(correctAnswer)].map((_, i) => (
          <img
            key={i}
            src={
              questionType === "apple"
                ? "/photos/lesson1/apple.png"
                : "/photos/lesson1/red_balloon.png"
            }
            alt={questionType}
            style={{
              width: 140, // bigger
              maxHeight: 150,
              objectFit: "contain",
              transition: "transform 0.3s ease, filter 0.3s ease",
              transform: highlightIndex === i ? "scale(1.3)" : "scale(1)",
              filter:
                highlightIndex === i
                  ? "drop-shadow(0 0 12px gold)"
                  : "drop-shadow(0 3px 7px rgba(0,0,0,0.25))",
            }}
          />
        ))}
      </div>

      {/* Secondary prompt above choices */}
      {showChoices && (
        <div
          style={{
            marginTop: 20,
            marginBottom: 18,
            fontSize: 26,
            fontWeight: 700,
            textShadow: oceanTheme.textShadow,
          }}
        >
          How many {niceType}?
        </div>
      )}

      {/* Choice tiles (lowered with marginTop) */}
      {showChoices && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 22,
            marginTop: 14,
            flexWrap: "wrap",
            maxWidth: 520,
          }}
        >
          {shuffledAnswers.map((num) => {
            const isSelected = selected === num;
            const bg = !isSelected
              ? oceanTheme.tile
              : num === correctAnswer
              ? oceanTheme.tileCorrect
              : oceanTheme.tileWrong;

            return (
              <button
                key={num}
                onClick={() => !isCounting && handleAnswer(num)}
                style={{
                  width: 95,
                  height: 95,
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: bg,
                  color: "#fff",
                  fontSize: 32,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 6px 12px rgba(0,0,0,0.28)",
                  transition: "all 0.18s ease",
                  textShadow: oceanTheme.textShadow,
                }}
              >
                {num}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssessmentMain;
