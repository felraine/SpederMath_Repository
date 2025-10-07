import React, { useState } from "react";
import "../../css/overlays.css";

export default function IntroScreen({ onNext }) {
  const [fading, setFading] = useState(false);
  const [clicked, setClicked] = useState(false);

  const handlePlaySound = () => {
    if (clicked) return;
    setClicked(true);
    setFading(true);

    const audio = new Audio("/audio/start_lesson.mp3");
    audio.onended = () => {
      onNext(); 
    };

    audio.onerror = () => {
      onNext();
    };

    audio.play().catch(() => onNext());
  };

  return (
    <section className="intro-screen">
      <div className="intro-wrap">
        <div className="text-center transition-opacity duration-300 ease-out">
          {/* "Play" title fades together with the button */}
          <h1
            className={`intro-title transition-opacity duration-300 ease-out ${
              fading ? "opacity-0" : "opacity-100"
            }`}
          >
            Play
          </h1>

          <div className="intro-actions">
            <button
              onClick={handlePlaySound}
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
      </div>
    </section>
  );
}
