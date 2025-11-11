// src/components/ui/FallingLeaves.jsx
import React from "react";

/**
 * Forest breeze background (CSS-only animation).
 * Usage:
 *   <div className="relative min-h-screen overflow-hidden">
 *     <FallingLeaves />   // sits behind your content
 *     {...your foreground...}
 *   </div>
 */
export default function FallingLeaves({ count = 15, className = "" }) {
  return (
    <div
      className={`sm-forest-leaves ${className}`}
      aria-hidden="true"
      // ensure it's a non-interactive background
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
    >
      {/* Inline-scoped CSS so it doesn't leak */}
      <style>{`
        /* container */
        .sm-forest-leaves {
          overflow: hidden;
        }
        .sm-forest-leaves__row {
          position: relative;
          top: -50px;
          width: 100%;
          text-align: right;
        }

        .sm-forest-leaves__row i {
          display: inline-block;
          width: 200px;
          height: 150px;
          background: linear-gradient(to bottom right, #309900, #005600);
          transform: skew(20deg) rotate(180deg);
          border-radius: 5% 40% 70%;
          box-shadow: inset 0 0 1px #222;
          border: 1px solid #333;
          z-index: 1;
          animation: sm-falling 5s 0s infinite ease-in-out;
          opacity: 0.7;
        }

        /* Alternate animation variants */
        .sm-forest-leaves__row i:nth-of-type(2n) { animation-name: sm-falling2; }
        .sm-forest-leaves__row i:nth-of-type(3n) { animation-name: sm-falling3; }

        /* Size variants */
        .sm-forest-leaves__row i:nth-of-type(n) { height:23px; width:30px; }
        .sm-forest-leaves__row i:nth-of-type(2n+1) { height:11px; width:16px; }
        .sm-forest-leaves__row i:nth-of-type(3n+2) { height:17px; width:23px; }

        /* Color / opacity variants */
        .sm-forest-leaves__row i:nth-of-type(n) { background: linear-gradient(to bottom right, #309900, #005600); }
        .sm-forest-leaves__row i:nth-of-type(2n+2) { background: linear-gradient(to bottom right, #5e9900, #2b5600); }
        .sm-forest-leaves__row i:nth-of-type(4n+1) { background: linear-gradient(to bottom right, #999900, #564500); }

        .sm-forest-leaves__row i:nth-of-type(n) { opacity: .7; }
        .sm-forest-leaves__row i:nth-of-type(3n+1) { opacity: .5; }
        .sm-forest-leaves__row i:nth-of-type(3n+2) { opacity: .3; }

        /* Stems / veins (pseudo elements) */
        .sm-forest-leaves__row i::before {
          position: absolute;
          content: '';
          top: 17px;
          right: 1px;
          height: 5px;
          width: 7px;
          transform: rotate(49deg);
          border-radius: 0% 15% 15% 0%;
          border-top: 1px solid #222;
          border-bottom: 1px solid #222;
          border-right: 1px solid #222;
          background: linear-gradient(to right, rgba(0,100,0,1), #005600);
          z-index: 1;
        }

        .sm-forest-leaves__row i::after {
          content: '';
          height: 17px;
          width: 2px;
          background: linear-gradient(to right, rgba(0,0,0,.15), rgba(0,0,0,0));
          display: block;
          transform: rotate(125deg);
          position: absolute;
          left: 12px;
          top: 0px;
          border-radius: 50%;
        }

        /* nth variants adjust pseudo sizes/positions */
        .sm-forest-leaves__row i:nth-of-type(2n+1)::before { width:4px; height:3px; top:7px; right:0px; }
        .sm-forest-leaves__row i:nth-of-type(2n+1)::after { width:2px; height:6px; left:5px; top:1px; }
        .sm-forest-leaves__row i:nth-of-type(3n+2)::before { height:4px; width:4px; top:12px; right:1px; }
        .sm-forest-leaves__row i:nth-of-type(3n+2)::after { height:10px; width:2px; top:1px; left:8px; }

        /* Staggered delays */
        .sm-forest-leaves__row i:nth-of-type(n)    { animation-delay: 1.9s; }
        .sm-forest-leaves__row i:nth-of-type(2n)   { animation-delay: 3.9s; }
        .sm-forest-leaves__row i:nth-of-type(3n)   { animation-delay: 2.3s; }
        .sm-forest-leaves__row i:nth-of-type(4n)   { animation-delay: 4.4s; }
        .sm-forest-leaves__row i:nth-of-type(5n)   { animation-delay: 5s;   }
        .sm-forest-leaves__row i:nth-of-type(6n)   { animation-delay: 3.5s; }
        .sm-forest-leaves__row i:nth-of-type(7n)   { animation-delay: 2.8s; }
        .sm-forest-leaves__row i:nth-of-type(8n)   { animation-delay: 1.5s; }
        .sm-forest-leaves__row i:nth-of-type(9n)   { animation-delay: 3.3s; }
        .sm-forest-leaves__row i:nth-of-type(10n)  { animation-delay: 2.5s; }
        .sm-forest-leaves__row i:nth-of-type(11n)  { animation-delay: 1.2s; }
        .sm-forest-leaves__row i:nth-of-type(12n)  { animation-delay: 4.1s; }
        .sm-forest-leaves__row i:nth-of-type(13n)  { animation-delay: 1s;   }
        .sm-forest-leaves__row i:nth-of-type(14n)  { animation-delay: 4.7s; }
        .sm-forest-leaves__row i:nth-of-type(15n)  { animation-delay: 3s;   }

        /* Keyframes (added px units for validity) */
        @keyframes sm-falling {
          0%   { transform: translate3d(300px, 0, 0) rotate(0deg) skew(20deg) rotate(180deg); }
          100% { transform: translate3d(-350px, 700px, 0) rotate(90deg) skew(20deg) rotate(180deg); opacity: 0; }
        }
        @keyframes sm-falling2 {
          0%   { transform: translate3d(0, 0, 0) rotate(90deg) skew(20deg) rotate(180deg); }
          100% { transform: translate3d(-400px, 680px, 0) rotate(0deg)  skew(20deg) rotate(180deg); opacity: 0; }
        }
        @keyframes sm-falling3 {
          0%   { transform: translate3d(0, 0, 0) rotate(-20deg) skew(20deg) rotate(180deg); }
          100% { transform: translate3d(-230px, 640px, 0) rotate(-70deg) skew(20deg) rotate(180deg); opacity: 0; }
        }

        /* Small screens: tone down sizes a bit */
        @media (max-width: 640px) {
          .sm-forest-leaves__row i:nth-of-type(n) { height: 18px; width: 24px; }
        }
      `}</style>

      <div className="sm-forest-leaves__row">
        {Array.from({ length: count }).map((_, i) => (
          // empty <i> elements are fine for pure-CSS shapes
          <i key={i} />
        ))}
      </div>
    </div>
  );
}
