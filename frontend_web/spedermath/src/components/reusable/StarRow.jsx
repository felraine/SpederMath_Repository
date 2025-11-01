// StarRow.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../css/star_anim.css";

/** Small particle burst that radiates out from the star center */
function Burst({ count = 10, radius = 48 }) {
  // Precompute particle trajectories
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const dist = radius * (0.6 + Math.random() * 0.4); // vary a bit
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const delay = i * 15; // slight stagger
      return { tx, ty, delay };
    });
  }, [count, radius]);

  return (
    <div className="burst">
      {particles.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            // CSS custom props for the keyframe to use
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

/** One star image that "pops" and emits a burst when it turns full */
function Star({ active }) {
  const [justActivated, setJustActivated] = useState(false);
  const prevActiveRef = useRef(active);

  useEffect(() => {
    if (!prevActiveRef.current && active) {
      // transitioned from off -> on
      setJustActivated(true);
      // hide burst after animation completes
      const t = setTimeout(() => setJustActivated(false), 700);
      return () => clearTimeout(t);
    }
    prevActiveRef.current = active;
  }, [active]);

  const src = active ? "/sprites/full_star.png" : "/sprites/empty_star.png";

  return (
    <div className="relative w-[72px] h-[72px] select-none">
      {/* Star image */}
      <img
        src={src}
        alt={active ? "Full star" : "Empty star"}
        draggable={false}
        className={`w-full h-full object-contain
          ${active ? "animate-star-pop will-change-transform" : "opacity-80"}
        `}
        style={{
          filter: active
            ? "drop-shadow(0 6px 16px rgba(255,215,0,0.55))"
            : "none",
        }}
      />

      {/* Sparkle burst overlay when star just turned on */}
      {justActivated && <Burst />}
    </div>
  );
}

export default function StarRow({ score }) {
  const target = score === 10 ? 3 : score >= 7 ? 2 : 1;

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
