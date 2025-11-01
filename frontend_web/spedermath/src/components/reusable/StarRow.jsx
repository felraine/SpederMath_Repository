// StarRow.jsx
import React, { useEffect, useState, useRef } from "react";
import "../css/star_anim.css";

/** One star image that "pops" when it turns full */
function Star({ active }) {
  const src = active ? "/sprites/full_star.png" : "/sprites/empty_star.png";
  return (
    <img
      src={src}
      alt={active ? "Full star" : "Empty star"}
      draggable={false}
      className={`w-[72px] h-[72px] object-contain select-none
        ${active ? "animate-star-pop will-change-transform" : "opacity-80"}
      `}
      style={{
        filter: active
          ? "drop-shadow(0 6px 16px rgba(255,215,0,0.55))"
          : "none",
      }}
    />
  );
}

/**
 * Animated row of 3 stars.
 * Rules:
 *   score < 7  => 1 star
 *   7..9       => 2 stars
 *   10         => 3 stars
 *
 * Stars appear one-by-one with a short delay like Angry Birds.
 */
export default function StarRow({ score }) {
  const target =
    score === 10 ? 3 : score >= 7 ? 2 : 1;

  const [revealed, setRevealed] = useState(0);
  const timersRef = useRef([]);

  // restart the sequence whenever the target changes
  useEffect(() => {
    // clear any pending timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setRevealed(0);

    // staggered reveal: first after 250ms, then every 450ms
    let i = 0;
    const kick = () => {
      if (i < target) {
        setRevealed((r) => Math.min(3, r + 1));
        i++;
        timersRef.current.push(setTimeout(kick, 450));
      }
    };
    timersRef.current.push(setTimeout(kick, 250));

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [target]);

  return (
    <div className="flex items-center justify-center gap-3 mt-3 mb-2">
      <Star active={revealed >= 1} />
      <Star active={revealed >= 2} />
      <Star active={revealed >= 3} />
    </div>
  );
}
