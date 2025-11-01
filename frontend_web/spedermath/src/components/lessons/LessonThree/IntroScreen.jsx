import React, { useEffect, useRef, useState } from "react";

export default function IntroScreen({ onNext }) {
  const [fading, setFading] = useState(false);
  const [clicked, setClicked] = useState(false);
  const audioRef = useRef(null);
  const initRef = useRef(false);

  const urlFor = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, "")}`;
  const unlock = () => setClicked(false);

  const wire = (a) => {
    const onErr = () => {
      console.warn("Audio error", a.error?.code);
      unlock();
    };
    a.onended = unlock;
    a.onerror = onErr;
    a.onloadedmetadata = () => {
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
    try {
      const r = await fetch(src, { method: "HEAD" });
      if (!r.ok) return false;
    } catch {}
    const a = audioRef.current ?? new Audio();
    audioRef.current = a;
    a.preload = "auto";
    a.src = src;
    try {
      await a.play();
      return true;
    } catch {
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
      let ok = await attemptPlay(PRIMARY);
      if (!ok) ok = await attemptPlay(FALLBACK);
      if (!ok) unlock();
    })();

    const hard = setTimeout(unlock, 15000);

    return () => {
      clearTimeout(hard);
      unwire();
      try {
        a.pause();
      } catch {}
    };
  }, []);

  const handlePlayClick = () => {
    if (clicked) return;
    setClicked(true);
    setFading(true);

    const audio = new Audio("/audio/start_lesson.mp3");
    audio.onended = () => onNext();
    audio.onerror = () => onNext();
    audio.play().catch(() => onNext());
  };

  return (
    <section
      className="intro-screen"
      style={{
        position: "fixed", 
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        width: "100%",
        height: "100%",
        backgroundImage: `url(${urlFor("photos/lesson3/forest9.jpg")})`,
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        className="intro-wrap"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <h1
          className={`intro-title transition-opacity duration-300 ease-out ${
            fading ? "opacity-0" : "opacity-100"
          }`}
        >
          Play
        </h1>

        <div className="intro-actions">
          <button
            onClick={handlePlayClick}
            disabled={clicked}
            className={`w-[220px] h-[220px] md:w-[300px] md:h-[300px] bg-center bg-no-repeat bg-contain mx-auto block
              transition-opacity duration-300 ease-out
              ${fading ? "opacity-0" : "opacity-100"}
              ${clicked ? "cursor-not-allowed" : "cursor-pointer"}
            `}
            style={{
              backgroundImage: "url('/backgrounds/play_button.png')",
            }}
          ></button>
        </div>
      </div>
    </section>
  );
}
