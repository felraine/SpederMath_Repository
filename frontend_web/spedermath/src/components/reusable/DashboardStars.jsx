// src/reusable/DashboardStars.jsx
import React from "react";

function Star({ active, size = 56 }) {
  const src = active ? "/sprites/full_star.png" : "/sprites/empty_star.png";
  return (
    <img
      src={src}
      alt={active ? "Full star" : "Empty star"}
      draggable={false}
      className="object-contain"
      style={{
        width: size,
        height: size,
        // very subtle glow on active, no pop animation
        filter: active ? "drop-shadow(0 4px 10px rgba(255,215,0,0.45))" : "none",
        opacity: active ? 1 : 0.85,
      }}
    />
  );
}

/** Same logic as StarRow (10=★★★, 7–9=★★, ≤6=★) but no animations. */
export default function DashboardStars({ score = 0, size = 56 }) {
  const stars = score === 10 ? 3 : score >= 7 ? 2 : score > 0 ? 1 : 0;
  if (stars === 0) return null; // hide if no score yet

  return (
    <div className="flex items-center justify-center gap-2">
      <Star active={stars >= 1} size={size} />
      <Star active={stars >= 2} size={size} />
      <Star active={stars >= 3} size={size} />
    </div>
  );
}
