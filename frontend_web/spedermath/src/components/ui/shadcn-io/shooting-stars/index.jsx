'use client';
import { cn } from "../../../../lib/utils";
import React, { useEffect, useRef, useState } from "react";

const rand = (a, b) => a + Math.random() * (b - a);

// top-only spawns, falling down-right ~65–85°
const getSpawn = () => {
  const x = Math.random() * window.innerWidth;
  const y = -50;
  const angle = rand(65, 85);
  return { x, y, angle };
};

export const ShootingStars = ({
  count = 5,              
  minSpeed = 20,
  maxSpeed = 50,
  minDelay = 400,          
  maxDelay = 1200,
  starColor = "#AEE8FF",
  trailColor = "rgba(110,203,255,0.9)",
  starWidth = 22,
  starHeight = 2.2,
  glow = true,
  className,
}) => {
  const [stars, setStars] = useState([]);
  const starsRef = useRef([]);
  const nextSpawnAtRef = useRef(0);
  const rafRef = useRef(0);
  const svgRef = useRef(null);

  // keep ref in sync
  useEffect(() => {
    starsRef.current = stars;
  }, [stars]);

  useEffect(() => {
    const spawnOne = () => {
      const { x, y, angle } = getSpawn();
      const s = {
        id: Math.random().toString(36).slice(2),
        x,
        y,
        angle,
        speed: rand(minSpeed, maxSpeed),
        distance: 0,
        scale: 1,
      };
      setStars(prev => [...prev, s]);
    };

    const loop = (now) => {
      setStars(prev =>
        prev
          .map(s => {
            const nx = s.x + s.speed * Math.cos((s.angle * Math.PI) / 180);
            const ny = s.y + s.speed * Math.sin((s.angle * Math.PI) / 180);
            const dist = s.distance + s.speed;
            const scale = 1 + dist / 150;
            const off =
              nx < -100 || nx > window.innerWidth + 100 || ny > window.innerHeight + 100;
            return off ? null : { ...s, x: nx, y: ny, distance: dist, scale };
          })
          .filter(Boolean)
      );

      if (starsRef.current.length < count && now >= nextSpawnAtRef.current) {
        spawnOne();
        const delay = rand(minDelay, maxDelay);
        nextSpawnAtRef.current = now + delay;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    nextSpawnAtRef.current = performance.now() + rand(minDelay, maxDelay);
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [count, minSpeed, maxSpeed, minDelay, maxDelay]);

  return (
    <svg ref={svgRef} className={cn("absolute inset-0 w-full h-full", className)}>
      <defs>
        <linearGradient id="shoot-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
          <stop offset="100%" style={{ stopColor: starColor, stopOpacity: 1 }} />
        </linearGradient>
        {glow && (
          <filter id="shoot-glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {stars.map(s => (
        <rect
          key={s.id}
          x={s.x}
          y={s.y}
          width={starWidth * s.scale}
          height={starHeight}
          fill="url(#shoot-grad)"
          transform={`rotate(${s.angle}, ${s.x + (starWidth * s.scale) / 2}, ${s.y + starHeight / 2})`}
          filter={glow ? "url(#shoot-glow)" : undefined}
          opacity="0.9"
        />
      ))}
    </svg>
  );
};
