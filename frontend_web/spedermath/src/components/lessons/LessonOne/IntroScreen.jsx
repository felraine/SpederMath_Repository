import React, { useEffect, useRef, useState } from "react";
import "../../css/overlays.css";

export default function IntroScreen({ onNext }) {
  const [ready, setReady] = useState(false);
  const audioRef = useRef(null);
  const initRef = useRef(false); // create Audio once
  const [fading, setFading] = useState(false); //play button fadking effect

  const handlePlaySound = () => {
  if (!ready) return;

  setFading(true);

  const audio = new Audio("/audio/start_lesson.mp3");
  
  audio.onended = () => {
    setTimeout(() => {
      onNext();
    }, 100); 
  };

  audio.play();
};
  useEffect(() => {
    // 1) Create the audio object only once
    if (!initRef.current) {
      const a = new Audio("/audio/lesson1/intro.mp3");
      audioRef.current = a;
      initRef.current = true;

      // Try autoplay once; if blocked, allow clicking immediately
      a.play().catch(() => setReady(true));
    }

    const a = audioRef.current;

    // 2) If it’s already done (e.g., prior mount played it), enable immediately
    if (!ready && (a.ended || (a.currentTime > 0 && a.paused))) {
      setReady(true);
    }

    // 3) Attach listeners on every mount
    const handleEnded = () => setReady(true);
    a.addEventListener("ended", handleEnded);

    // 4) Also make sure we start once it’s loadable if needed
    const handleCanPlay = () => {
      if (!a.ended && a.currentTime === 0) {
        a.play().catch(() => setReady(true));
      }
    };
    a.addEventListener("canplaythrough", handleCanPlay, { once: true });

    // 5) Cleanup: remove listeners only (don’t pause/reset the audio)
    return () => {
      a.removeEventListener("ended", handleEnded);
      a.removeEventListener("canplaythrough", handleCanPlay);
    };
  }, [ready]);

  //removed intro-subtitle, intro-title, & intro-card intro-centered. Dont delete this comment please. -K
  return (
    <section className="intro-screen">
      <div className="intro-wrap">
        <div className="text-center">
          <h1 className="intro-title">Play</h1>
          <div className="intro-actions">
           <button
            onClick={handlePlaySound}
            disabled={!ready}
            className={`w-[220px] h-[220px] md:w-[300px] md:h-[300px] bg-center bg-no-repeat bg-contain mx-auto block
              transition-opacity duration-300 ease-out
              ${fading ? "opacity-0" : "opacity-100"}
              cursor-pointer
            `}
            style={{
              backgroundImage: "url('/backgrounds/play_button.png')",
            }}
          ></button>
          </div>
        </div>
      </div>
    </section>
  );
}
