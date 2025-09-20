import React, { useEffect, useRef, useState } from "react";
import "../../css/overlays.css";

export default function IntroScreen({ onNext }) {
  const [ready, setReady] = useState(false);
  const audioRef = useRef(null);
  const initRef = useRef(false); // create Audio once

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

    // 4) Also make sure we start once it’s loadable if needed (in case autoplay blocked then allowed)
    const handleCanPlay = () => {
      // Only attempt play if not started yet and still not ready
      if (!a.ended && a.currentTime === 0) {
        a.play().catch(() => setReady(true));
      }
    };
    a.addEventListener("canplaythrough", handleCanPlay, { once: true });

    // 5) Cleanup: remove listeners only (don’t pause/reset the audio)
    return () => {
      a.removeEventListener("ended", handleEnded);
      // no a.pause()/a.currentTime=0 here — keeps state across StrictMode remounts
    };
  }, [ready]);

  return (
    <section className="intro-screen">
      <div className="intro-wrap">
        <div className="intro-card intro-centered">
          <img
            src="/munchie/eyelessneutral_Munchie.png"
            alt="Munchie the mascot"
            className="w-40 h-40 mx-auto mb-6 munchie-bounce"
          />

          <h1 className="intro-title">Welcome, Friend!</h1>

          <p className="intro-subtitle">
            Let’s learn numbers <span className="font-bold">1</span>,{" "}
            <span className="font-bold">2</span>, and{" "}
            <span className="font-bold">3</span>!
          </p>

          <div className="intro-actions">
            <button
              className={`btn btn-primary ${
                !ready ? "opacity-60 cursor-not-allowed" : ""
              }`}
              onClick={onNext}
              disabled={!ready}
              aria-disabled={!ready}
              title={!ready ? "Please listen first" : "Start Lesson"}
            >
              Start Lesson
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
