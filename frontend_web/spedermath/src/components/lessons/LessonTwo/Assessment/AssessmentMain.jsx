// src/lessons/lesson2/AssessmentMain.jsx
import React, { useEffect, useState, useRef } from "react";

const numberAudioMap = {
  1: "one", 2: "two", 3: "three", 4: "four",
  5: "five"
};

const correctAudios = [
  "/audio/lesson2/correct/good_job.mp3",
  "/audio/lesson2/correct/nice_work.mp3",
];

const wrongAudios = [
  "/audio/lesson2/wrong/good_attempt.mp3",
  "/audio/lesson2/wrong/nice_try.mp3",
];

const oceanTheme = {
  tile: "rgba(0, 95, 160, 0.35)",
  tileHover: "rgba(0, 95, 160, 0.5)",
  tileCorrect: "linear-gradient(145deg, #37d67a, #1aa35b)",
  tileWrong: "linear-gradient(145deg, #ff6b6b, #c81e1e)",
  textShadow: "2px 3px 8px rgba(0,0,0,0.35)",
  panel: "rgba(0, 40, 85, 0.22)",
};

const MAX_N = 5;
const TOTAL_QUESTIONS = 10;

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
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    startNewRound();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line
  }, [questionIndex]);

  const shuffleArray = (array) =>
    array.map((v) => ({ v, sort: Math.random() }))
         .sort((a,b) => a.sort - b.sort)
         .map(({ v }) => v);

  const playRandomAudio = (list, cb) => {
    const f = list[Math.floor(Math.random()*list.length)];
    const a = new Audio(f);
    activeAudio.current = a;
    a.play().catch(()=>{});
    if (cb) a.onended = cb;
  };

  const startNewRound = () => {
    const randomCount = Math.floor(Math.random() * MAX_N) + 1;
    const randomType = Math.random() > 0.5 ? "apple" : "balloon";

    setQuestionType(randomType);
    setCorrectAnswer(randomCount);
    setShuffledAnswers(shuffleArray(Array.from({ length: MAX_N }, (_, i) => i+1)));
    setSelected(null);
    setIsCounting(false);
    setHighlightIndex(-1);
    setShowChoices(false);

    const qAudio = new Audio(
      randomType === "apple"
        ? "/audio/lesson2/how_many_apples.mp3"
        : "/audio/lesson2/how_many_balloons.mp3"
    );
    activeAudio.current = qAudio;
    qAudio.onended = () => setShowChoices(true);
    qAudio.onerror = () => setShowChoices(true);
    qAudio.play().catch(() => setShowChoices(true));
  };

  const handleAnswer = (num) => {
    if (isCounting) return;
    setSelected(num);
    setIsCounting(true);
    let i = 1;

    const playNext = () => {
      if (!mountedRef.current) return;
      if (i <= correctAnswer) {
        const word = numberAudioMap[i];
        const terminal = `/audio/lesson2/${word}_${questionType}s.mp3`;
        const base = `/audio/lesson2/${word}.mp3`;

        setHighlightIndex(i-1);

        const clip = new Audio(i===correctAnswer ? terminal : base);
        activeAudio.current = clip;
        clip.play().catch(()=>{});
        clip.onended = () => { i++; playNext(); };
        clip.onerror = () => { i++; playNext(); };
      } else {
        setTimeout(() => {
          if (num === correctAnswer) {
            setScore((s)=>s+1);
            playRandomAudio(correctAudios, nextQuestion);
          } else {
            playRandomAudio(wrongAudios, nextQuestion);
          }
        }, 400);
      }
    };
    playNext();
  };

  const nextQuestion = () => {
    setIsCounting(false);
    setHighlightIndex(-1);
    if (questionIndex < TOTAL_QUESTIONS-1) {
      setQuestionIndex((q)=>q+1);
    } else {
      onFinish?.(score);
    }
  };

  const niceType = questionType === "apple" ? "apples" : "balloons";

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start p-6" style={{ color:"#f5faff" }}>
      <button onClick={()=>window.history.back()} className="absolute top-4 left-4">
        <img src="/Back%20Button.png" alt="Back" className="w-10 h-10"/>
      </button>

      {/* Top banner */}
      <div style={{
        display:"flex",alignItems:"center",gap:14,padding:"10px 18px",
        background:oceanTheme.panel,borderRadius:999,backdropFilter:"blur(4px)",
        boxShadow:"0 6px 14px rgba(0,0,0,0.25)",marginBottom:18,fontWeight:700,
        textShadow:oceanTheme.textShadow
      }}>
        🧠 Question {questionIndex+1}/{TOTAL_QUESTIONS}
        <span style={{ width:1,height:22,background:"rgba(255,255,255,0.35)" }}/>
        ⭐ Score: {score}
      </div>

      <h2 style={{ fontSize:36,fontWeight:800,margin:"40px 0 20px",textShadow:oceanTheme.textShadow }}>
        Let’s count the {niceType}!
      </h2>

      {/* Objects */}
      <div style={{display:"flex",justifyContent:"center",gap:32,margin:"20px 0 30px",flexWrap:"wrap"}}>
        {[...Array(correctAnswer)].map((_,i)=>(
          <img
            key={i}
            src={questionType==="apple" ? "/photos/lesson2/apple.png" : "/photos/lesson2/red_balloon.png"}
            alt={questionType}
            style={{
              width:140,maxHeight:150,objectFit:"contain",
              transform: highlightIndex===i ? "scale(1.3)" : "scale(1)",
              filter: highlightIndex===i ? "drop-shadow(0 0 12px gold)" : "drop-shadow(0 3px 7px rgba(0,0,0,0.25))",
              transition:"transform 0.3s ease, filter 0.3s ease"
            }}
          />
        ))}
      </div>

      {showChoices && (
        <>
          <div style={{ margin:"20px 0 18px",fontSize:26,fontWeight:700,textShadow:oceanTheme.textShadow }}>
            How many {niceType}?
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:22,flexWrap:"wrap",maxWidth:600}}>
            {shuffledAnswers.map((n)=>(
              <button
                key={n}
                onClick={()=>!isCounting && handleAnswer(n)}
                style={{
                  width:95,height:95,borderRadius:18,
                  border:"1px solid rgba(255,255,255,0.35)",
                  background: selected===n ? (n===correctAnswer?oceanTheme.tileCorrect:oceanTheme.tileWrong) : oceanTheme.tile,
                  color:"#fff",fontSize:32,fontWeight:800,cursor:"pointer",
                  boxShadow:"0 6px 12px rgba(0,0,0,0.28)",transition:"all 0.18s ease",
                  textShadow:oceanTheme.textShadow
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AssessmentMain;
