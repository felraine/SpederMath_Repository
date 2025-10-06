// src/lessons/lesson3/IntroScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import "../../css/overlays.css";

export default function IntroScreen({ onNext }) {
  const [ready, setReady] = useState(false);
  const audioRef = useRef(null);
  const initRef = useRef(false);

  // Build URLs that respect Vite base (works under subpaths)
  const urlFor = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, "")}`;
  const PRIMARY = urlFor("audio/lesson3/intro.mp3");
  const FALLBACK = urlFor("audio/lesson1/intro.mp3");

  const unlock = () => setReady(true);

  const wire = (a) => {
    const onErr = () => {
      console.warn("Audio error", a.error?.code);
      unlock();
    };
    a.onended = unlock;
    a.onerror = onErr;
    a.onloadedmetadata = () => {
      // precise backup: duration + a little padding
      const pad = setTimeout(unlock, Math.max((a.duration - a.currentTime) * 1000 + 150, 500));
      a._pad = pad;
    };
    a.addEventListener("timeupdate", () => {
      if (!isFinite(a.duration)) return;
      if (a.currentTime >= a.duration - 0.2) unlock();
    });
    return () => {
      a.onended = null;
      a.onerror = null;
      a.onloadedmetadata = null;
      if (a._pad) clearTimeout(a._pad);
      a.removeAttribute("src");
      a.load?.();
    };
  };

  const attemptPlay = async (src) => {
    // HEAD check to catch 404/casing issues fast
    try {
      const r = await fetch(src, { method: "HEAD" });
      if (!r.ok) {
        console.warn("HEAD failed", src, r.status);
        return false;
      }
    } catch (e) {
      console.warn("HEAD error", src, e);
      // continue; some servers may block HEAD, we’ll still try to play
    }

    const a = audioRef.current ?? new Audio();
    audioRef.current = a;
    a.preload = "auto";
    a.src = src;

    try {
      await a.play(); // may reject due to autoplay
      return true;
    } catch (err) {
      console.warn("Autoplay blocked or play() failed:", err?.name || err);
      return false;
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const a = new Audio();
    audioRef.current = a;
    const unwire = wire(a);

    (async () => {
      // try lesson 3
      let ok = await attemptPlay(PRIMARY);
      if (!ok) {
        // fallback to lesson 1
        ok = await attemptPlay(FALLBACK);
      }
      if (!ok) {
        // couldn’t autoplay either source -> let user click “Start Lesson”
        unlock();
      }
    })();

    // final hard safety
    const hard = setTimeout(unlock, 15000);

    return () => {
      clearTimeout(hard);
      unwire();
      try {
        a.pause();
      } catch {}
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
            Let’s learn numbers <span className="font-bold">1</span>,{" "}
            <span className="font-bold">2</span>, <span className="font-bold">3</span>,{" "}
            <span className="font-bold">4</span>, <span className="font-bold">5</span>,{" "}
            <span className="font-bold">6</span>, and <span className="font-bold">7</span>!
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
