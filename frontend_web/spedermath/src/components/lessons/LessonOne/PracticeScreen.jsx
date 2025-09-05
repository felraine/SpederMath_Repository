import React, { useEffect, useState, useRef } from "react";

const PracticeScreen = ({ onNext }) => {
  const [correctAnswer, setCorrectAnswer] = useState(1);
  const [selected, setSelected] = useState(null);
  const [isCounting, setIsCounting] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState([1, 2, 3]);
  const [showChoices, setShowChoices] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const activeAudio = useRef(null);

  const numberAudioMap = { 1: "one", 2: "two", 3: "three" };

  const correctAudios = [
    "/audio/lesson1/correct/good_job.mp3",
    "/audio/lesson1/correct/nice_work.mp3",
  ];
  const wrongAudios = [
    "/audio/lesson1/wrong/good_attempt.mp3",
    "/audio/lesson1/wrong/nice_try.mp3",
  ];

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

  useEffect(() => {
    startNewRound();
    return () => {
      if (activeAudio.current) {
        activeAudio.current.pause();
        activeAudio.current.currentTime = 0;
      }
    };
  }, []);

  const startNewRound = () => {
    const randomCount = Math.floor(Math.random() * 3) + 1;
    setCorrectAnswer(randomCount);
    setShuffledAnswers(shuffleArray([1, 2, 3]));
    setSelected(null);
    setIsCounting(false);
    setShowChoices(false);
    setHighlightIndex(-1);

    const q1 = new Audio("/audio/lesson1/how_many_apples.mp3");
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
    setSelected(num);
    setIsCounting(true);
    let i = 1;

    const playNextNumber = () => {
      if (i <= num) {
        const file =
          i === num
            ? `/audio/lesson1/${numberAudioMap[i]}_apples.mp3`
            : `/audio/lesson1/${numberAudioMap[i]}.mp3`;

        const audio = new Audio(file);
        activeAudio.current = audio;
        setHighlightIndex(i - 1);
        audio.play();

        audio.onended = () => {
          setTimeout(() => {
            i++;
            playNextNumber();
          }, 600);
        };
      } else {
        setTimeout(() => {
          if (num === correctAnswer) {
            playRandomAudio(correctAudios, () =>
              setTimeout(() => onNext(), 1000)
            );
          } else {
            playRandomAudio(wrongAudios, () =>
              setTimeout(() => {
                setIsCounting(false);
                setHighlightIndex(-1);
              }, 800)
            );
          }
        }, 500);
      }
    };

    playNextNumber();
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
      <h2 style={{ fontSize: "28px", marginBottom: "20px", color: "#333" }}>
        How many apples do you see?
      </h2>

      {/* Apples */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "30px",
          margin: "30px 0",
        }}
      >
        {[...Array(correctAnswer)].map((_, i) => (
          <img
            key={i}
            src="/photos/lesson1/apple.png"
            alt="apple"
            style={{
              width: "100px", // bigger apples 🍎
              transition: "transform 0.4s ease, filter 0.4s ease",
              transform: highlightIndex === i ? "scale(1.4)" : "scale(1)",
              filter:
                highlightIndex === i
                  ? "drop-shadow(0px 0px 10px gold)"
                  : "drop-shadow(0px 0px 5px rgba(0,0,0,0.2))",
            }}
          />
        ))}
      </div>

      {/* Choices */}
      {showChoices && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            marginTop: "20px",
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

export default PracticeScreen;