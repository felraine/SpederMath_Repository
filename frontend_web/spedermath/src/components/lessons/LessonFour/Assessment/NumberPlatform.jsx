// src/lessons/LessonFour/Assessment/NumberPlatform.jsx
import React, { useEffect, useRef, useState } from "react";

const clampNum = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** Avatar layout */
const AVATAR_SIZE = 84;    // avatar circle size
const AVATAR_GAP  = 8;     // rest gap above bottom grass
const LAND_GAP    = 6;     // landing gap above top grass

export default function NumberPlatform({
  rounds = 5,
  livesPerRound = 3,
  range = [1, 10],
  lessonId,
  onGameOver,
}) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [lives, setLives] = useState(livesPerRound);

  const [current, setCurrent] = useState(range[0]);       // bottom platform number
  const [correctNext, setCorrectNext] = useState(range[0] + 1);
  const [leftValue, setLeftValue] = useState(null);       // raised left option
  const [rightValue, setRightValue] = useState(null);     // raised right option

  const [isLocked, setIsLocked] = useState(false);
  const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 });

  const [minN, maxN] = range;
  const startedAtRef = useRef(Date.now());

  // ------- detect desktop vs tablet (>= 1024px is desktop) -------
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // refs for precise positioning
  const avatarAnchorRef = useRef(null);
  const platLeftRef = useRef(null);
  const platRightRef = useRef(null);
  const platBottomRef = useRef(null);

  // ---------------- platform setup ----------------
  const buildPlatforms = (target) => {
    const pool = [];
    for (let i = minN; i <= maxN; i++) if (i !== target) pool.push(i);
    const distractor = pool[Math.floor(Math.random() * pool.length)];
    if (Math.random() < 0.5) {
      setLeftValue(target);
      setRightValue(distractor);
    } else {
      setLeftValue(distractor);
      setRightValue(target);
    }
  };

  const resetRound = (advance = false) => {
    setLives(livesPerRound);
    setCurrent(minN);
    setCorrectNext(minN + 1);
    buildPlatforms(minN + 1);
    // after layout paints, rest above the bottom platform's grass
    requestAnimationFrame(() => centerAboveTopEdge(platBottomRef.current));
    if (advance) setRoundIndex((i) => i + 1);
  };

  useEffect(() => {
    resetRound(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // finish condition
  useEffect(() => {
    if (roundIndex >= rounds) {
      const durationSec = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));
      const total = rounds;
      const status = score >= Math.ceil(total * 0.6) ? "PASSED" : "FAILED";
      onGameOver?.({
        lessonId,
        score,
        total,
        wrongs,
        rounds,
        status,
        durationSec,
        game: "NumberPlatform",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex]);

  // ---------------- precise positioning helpers ----------------
  const getCenter = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  const offsetTo = (x, y) => {
    const a = getCenter(avatarAnchorRef.current);
    return { x: x - a.x, y: y - a.y };
  };

  // rest/land ABOVE a platform's top edge (so you're above the grass)
  const centerAboveTopEdge = (el, gap = AVATAR_GAP) => {
    if (!el || !avatarAnchorRef.current) return;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top - (AVATAR_SIZE / 2 + gap);
    setAvatarOffset(offsetTo(x, y));
  };

  // keep avatar aligned when viewport changes
  useEffect(() => {
    const onResize = () => centerAboveTopEdge(platBottomRef.current);
    window.addEventListener("resize", onResize);
    requestAnimationFrame(() => centerAboveTopEdge(platBottomRef.current));
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ---------------- interactions ----------------
  const handlePick = (side) => {
    if (isLocked) return;
    const picked = side === "left" ? leftValue : rightValue;
    const correct = picked === correctNext;

    setIsLocked(true);
    // land above chosen top platform's grass (not on the number)
    centerAboveTopEdge(side === "left" ? platLeftRef.current : platRightRef.current, LAND_GAP);

    setTimeout(() => {
      if (correct) {
        const next = clampNum(correctNext + 1, minN, maxN);
        setCurrent(correctNext);

        if (correctNext === maxN) {
          setScore((s) => s + 1);
          resetRound(true);
          setIsLocked(false);
          return;
        } else {
          setCorrectNext(next);
          buildPlatforms(next);
        }
      } else {
        setLives((L) => {
          const nl = L - 1;
          if (nl <= 0) {
            setWrongs((w) => w + 1);
            resetRound(true);
            setIsLocked(false);
            return livesPerRound;
          }
          return nl;
        });
      }

      // brief pause, then return to above bottom grass
      setTimeout(() => {
        centerAboveTopEdge(platBottomRef.current);
        setIsLocked(false);
      }, 220);
    }, 260);
  };

  // keyboard arrows
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") handlePick("left");
      if (e.key === "ArrowRight") handlePick("right");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftValue, rightValue, correctNext, isLocked]);

  // ---------------- visuals ----------------
  const hud = "px-4 py-2 rounded-full bg-black/30 text-white font-bold backdrop-blur";

  // Slim grass cap; numbers live in the dirt
  // Grass 18% / edge 4% / dirt 78%
  const PLATFORM_BG =
    "linear-gradient(#59c94b 0 18%, #3aa33a 18% 22%, #8b5a2b 22% 100%)";

  // Layout config per form factor
  const layout = isDesktop
    ? {
        arenaH: "min(66vh, 560px)",                            // desktop: a bit shorter so it doesn't look low
        topTop: "clamp(80px, calc(var(--arena-h) * 0.22), 180px)",
        bottomBottom: "clamp(60px, calc(var(--arena-h) * 0.11), 110px)",
        avatarBottom: "clamp(92px, calc(var(--arena-h) * 0.25), 150px)",
        gap: "clamp(20px, 3vw, 40px)",
        topWidthClass: "w-[86%]",                               // tighter row width on desktop
        platW: "clamp(260px, 22vw, 420px)",
        platH: "clamp(92px, 9.5vw, 120px)",
        bottomW: "clamp(340px, 30vw, 560px)",
      }
    : {
        arenaH: "min(78vh, 580px)",                            // tablets: taller/denser
        topTop: "clamp(120px, calc(var(--arena-h) * 0.32), 240px)",
        bottomBottom: "clamp(72px, calc(var(--arena-h) * 0.13), 120px)",
        avatarBottom: "clamp(104px, calc(var(--arena-h) * 0.29), 160px)",
        gap: "clamp(16px, 4vw, 32px)",
        topWidthClass: "w-[92%]",
        platW: "clamp(236px, 28vw, 380px)",
        platH: "clamp(90px, 10.8vw, 124px)",
        bottomW: "clamp(280px, 36vw, 440px)",
      };

  const Platform = React.forwardRef(function Platform(
    { label, highlight = false, onClick, disabled, style },
    ref
  ) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={`relative rounded-2xl border
                    border-black/25 shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition
                    ${highlight ? "ring-4 ring-yellow-300/70" : ""}
                    active:scale-[0.99]`}
        style={{
          width: layout.platW,
          height: layout.platH,
          background: PLATFORM_BG,
          ...style,
        }}
        aria-label={`Platform ${label}`}
      >
        {/* subtle dirt texture */}
        <div
          className="absolute inset-0 opacity-[0.10] pointer-events-none rounded-2xl"
          style={{
            background:
              "repeating-linear-gradient(45deg, #000, #000 2px, transparent 2px, transparent 6px)",
          }}
        />
        {/* number sits in the dirt just below grass */}
        <div className="absolute left-0 right-0 flex justify-center" style={{ top: "34%" }}>
          <span className="text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] text-3xl sm:text-4xl font-extrabold">
            {label}
          </span>
        </div>
      </button>
    );
  });

  return (
    <div className="relative w-full h-full min-h-[640px] flex flex-col items-center justify-start pt-8 text-white">
      {/* HUD */}
      <div className="w-full max-w-6xl flex items-center justify-between px-4">
        <div className="flex gap-2">
          <span className={hud}>Round {roundIndex + 1}/{rounds}</span>
          <span className={hud}>⭐ Points: {score}</span>
          <span className={hud}>❌ Wrongs: {wrongs}</span>
        </div>
        <div className={hud}>❤️ Lives: {lives}</div>
      </div>

      {/* Prompt */}
      <div className="mt-4 text-center text-black/90">
        <div className="text-3xl sm:text-4xl font-extrabold">
          Go to <span className="underline">number {correctNext}</span>
        </div>
        <div className="mt-1">
          You’re standing on <strong>{current}</strong>. Reach <strong>{maxN}</strong> to earn a point!
        </div>
      </div>

      {/* ARENA (CSS var so positions scale consistently per layout) */}
      <div
        className="relative w-full max-w-6xl mt-8"
        style={{
          "--arena-h": layout.arenaH,
          height: "var(--arena-h)",
        }}
      >
        {/* upper platforms (choices) */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 ${layout.topWidthClass} flex items-start justify-between px-4`}
          style={{
            top: layout.topTop,
            gap: layout.gap,
          }}
        >
          <Platform
            ref={platLeftRef}
            label={leftValue}
            onClick={() => handlePick("left")}
            disabled={isLocked}
          />
          <Platform
            ref={platRightRef}
            label={rightValue}
            onClick={() => handlePick("right")}
            disabled={isLocked}
          />
        </div>

        {/* bottom center platform (current) */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: layout.bottomBottom }}
        >
          <Platform
            ref={platBottomRef}
            label={current}
            highlight
            disabled
            style={{ width: layout.bottomW }}
          />
        </div>

        {/* avatar anchor (movement is via transform offsets) */}
        <div
          ref={avatarAnchorRef}
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{ bottom: layout.avatarBottom }}
          aria-hidden="true"
        >
          <div
            className="transition-transform duration-300 ease-out"
            style={{ transform: `translate(${avatarOffset.x}px, ${avatarOffset.y}px)` }}
          >
            {/* avatar */}
            <div className="w-[84px] h-[84px] rounded-full border-2 border-white/80
                            bg-gradient-to-b from-sky-200 to-sky-500 flex items-center justify-center
                            shadow-[0_10px_24px_rgba(0,0,0,0.33)] text-3xl">
              🐟
            </div>
            <div className="text-center mt-1 font-bold text-black/80">You</div>
          </div>
        </div>
      </div>

      <div className="mt-1 text-black/70">Pick the raised platform with the next number.</div>
    </div>
  );
}
