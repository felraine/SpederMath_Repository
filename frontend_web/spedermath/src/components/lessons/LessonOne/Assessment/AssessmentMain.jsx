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
    const randomFile =
      audioList[Math.floor(Math.random() * audioList.length)];
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

  return (
      <div
        className="screen"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "30px",
        }}
      >
        {/* Progress / Score */}
        <div style={{ marginBottom: "20px", fontSize: "20px", color: "#333" }}>
          Question {questionIndex + 1} of 10 | Score: {score}
        </div>

        {/* How many text */}
        <div style={{ fontSize: "24px", marginBottom: "15px", color: "#555" }}>
          How many {questionType === "apple" ? "apples" : "balloons"}?
        </div>

        {/* Objects */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            margin: "30px 0",
            flexWrap: "wrap",
            maxWidth: "700px",
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
                width: "100px",
                maxHeight: "120px",
                objectFit: "contain",
                transition: "transform 0.4s ease, filter 0.4s ease",
                transform: highlightIndex === i ? "scale(1.4)" : "scale(1)",
                filter:
                  highlightIndex === i
                    ? "drop-shadow(0px 0px 10px gold)"
                    : "drop-shadow(0px 0px 4px rgba(0,0,0,0.3))",
              }}
            />
          ))}
        </div>

        {/* Choices */}
        {showChoices && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "15px",
              marginTop: "20px",
              maxWidth: "500px",
            }}
          >
            {shuffledAnswers.map((num) => (
              <button
                key={num}
                onClick={() => !isCounting && handleAnswer(num)}
                style={{
                  width: "80px",
                  height: "80px",
                  fontSize: "28px",
                  fontWeight: "bold",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor:
                    selected === num
                      ? num === correctAnswer
                        ? "#4CAF50"
                        : "#F44336"
                      : "#FFD54F",
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                  transition: "transform 0.2s ease, background-color 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                {num}
              </button>
            ))}
          </div>
        )}
      </div>
  );
};

export default AssessmentMain;
