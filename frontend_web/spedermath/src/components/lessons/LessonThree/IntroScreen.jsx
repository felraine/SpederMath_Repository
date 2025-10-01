// src/lessons/lesson3/IntroScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import "../../css/overlays.css";

export default function IntroScreen({ onNext, meta }) {
  const [ready, setReady] = useState(false);
  const audioRef = useRef(null);
  const initRef = useRef(false); // create Audio once

  // try lesson 3 intro, fallback to lesson1 intro if missing
  const playWithFallback = (primarySrc, fallbackSrc) => {
    const a = new Audio(primarySrc);
    audioRef.current = a;
    a.onended = () => setReady(true);
    a.onerror = () => {
      const b = new Audio(fallbackSrc);
      audioRef.current = b;
      b.onended = () => setReady(true);
      b.onerror = () => setReady(true);
      b.play().catch(() => setReady(true));
    };
    a.play().catch(() => {
      const b = new Audio(fallbackSrc);
      audioRef.current = b;
      b.onended = () => setReady(true);
      b.onerror = () => setReady(true);
      b.play().catch(() => setReady(true));
    });
  };

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      // ✅ provide a real fallback
      playWithFallback("/audio/lesson3/intro.mp3", "/audio/lesson1/intro.mp3");
    }

    // safety: if something goes wrong, enable after N seconds
    const safety = setTimeout(() => setReady(true), 15000); // 15s or your intro length
    return () => {
      clearTimeout(safety);
      const a = audioRef.current;
      if (a) {
        a.onended = null;
        a.onerror = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            Let’s learn numbers{" "}
            <span className="font-bold">1</span>,{" "}
            <span className="font-bold">2</span>,{" "}
            <span className="font-bold">3</span>,{" "}
            <span className="font-bold">4</span>,{" "}
            <span className="font-bold">5</span>,{" "}
            <span className="font-bold">6</span>, and{" "}
            <span className="font-bold">7</span>!
          </p>

          <div className="intro-actions">
            <button
              className={`btn btn-primary ${!ready ? "opacity-60 cursor-not-allowed" : ""}`}
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
