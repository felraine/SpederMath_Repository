import React, { useEffect, useRef, useState } from "react";
import { postOnce } from "../../../../utils/requestDedupe";
import { currentStudentId } from "../../../../utils/auth";
import { useNavigate } from "react-router-dom";

/* === NEW: tutorial overlay === */
import NumberPlatformTutorial, {
  numberPlatformTourSteps,
} from "../../tutorial/NumberPlatformTutorial";

const clampNum = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** Avatar layout */
const AVATAR_SIZE = 84;    // avatar circle size
const AVATAR_GAP  = 8;     // rest gap above bottom grass
const LAND_GAP    = 6;     // landing gap above top grass


function TopHeader({ title, progressLabel, onBack, onShowTutorial }) {
  return (
    <div
      className="absolute top-0 left-0 w-full flex items-center justify-between p-3 sm:p-4 bg-black/40 backdrop-blur-sm text-white"
      style={{ zIndex: 40, height: 72 }}
    >
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 transition"
        aria-label="Go back"
      >
        <img
          src="/Back Button.png"
          alt=""
          className="w-7 h-7 object-contain drop-shadow"
          draggable="false"
        />
        <span className="hidden sm:inline font-semibold">Back</span>
      </button>

      {/* Title */}
      <div className="flex-1 flex items-center justify-center pointer-events-none">
        <div className="font-bold text-base sm:text-lg drop-shadow">{title}</div>
      </div>

      {/* Tutorial + Progress */}
      <div className="flex items-center gap-2">
        <button
          onClick={onShowTutorial}
          className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 text-sm font-semibold"
        >
          Tutorial
        </button>
        <div className="font-semibold drop-shadow">{progressLabel}</div>
      </div>
    </div>
  );
}

export default function NumberPlatform({
  rounds = 5,
  livesPerRound = 3,
  range = [0, 10],            // ← start from 0 now
  lessonId,                   // submit with this lessonId when game ends
  onGameOver,                 // optional callback(result)
  /* === NEW: allow disabling tutorial if needed === */
  enableTutorial = true,
}) {
  const navigate = useNavigate();
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
  const RAISE_UP_PX = 24;

  const [minN, maxN] = range;
  const startedAtRef = useRef(Date.now());
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  /* === NEW: tutorial state === */
  const [showTut, setShowTut] = useState(false);
  const [tutStep, setTutStep] = useState(0);

  // ------- responsive breakpoint -------
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

  /* === NEW: open tutorial shortly after first layout so the selectors exist === */
  useEffect(() => {
    if (!enableTutorial) return;
    const t = setTimeout(() => setShowTut(true), 600);
    return () => clearTimeout(t);
  }, [enableTutorial]);

  // finish condition
  useEffect(() => {
    if (roundIndex >= rounds) {
      const durationSec = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));
      const total = rounds;
      const status = score >= Math.ceil(total * 0.6) ? "COMPLETED" : "FAILED";

      const result = {
        lessonId,
        score,
        total,
        wrongs,
        rounds,
        status,
        durationSec,
        game: "NumberPlatform",
      };

      (async () => {
        if (!lessonId) {
          onGameOver?.(result);
          return;
        }

        try {
          const token = localStorage.getItem("token");
          if (!token) throw new Error("Missing auth token");

          const sid = currentStudentId();
          const key = `submit:${sid}:${lessonId}:${status}`;

          await postOnce(key, async () => {
            const res = await fetch(`${API_BASE}/api/student-progress/submit`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                lessonId,
                score,
                status,
                timeSpentInSeconds: durationSec,
                retakes_count: 0,
              }),
            });
            if (!res.ok) {
              const text = await res.text().catch(() => "");
              throw new Error(`Submit failed ${res.status}: ${text || res.statusText}`);
            }
          });
        } catch (e) {
          console.warn("NumberPlatform submit failed (guarded):", e);
        } finally {
          onGameOver?.(result);
        }
      })();
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
  const PLATFORM_BG = "linear-gradient(#59c94b 0 18%, #3aa33a 18% 22%, #8b5a2b 22% 100%)";

  const layout = isDesktop
    ? {
        arenaH: "min(66vh, 560px)",
        topTop: "clamp(80px, calc(var(--arena-h) * 0.22), 180px)",
        bottomBottom: "clamp(60px, calc(var(--arena-h) * 0.11), 110px)",
        avatarBottom: "clamp(92px, calc(var(--arena-h) * 0.25), 150px)",
        gap: "clamp(20px, 3vw, 40px)",
        topWidthClass: "w-[86%]",
        platW: "clamp(260px, 22vw, 420px)",
        platH: "clamp(92px, 9.5vw, 120px)",
        bottomW: "clamp(340px, 30vw, 560px)",
      }
    : {
        arenaH: "min(78vh, 580px)",
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
    { label, highlight = false, onClick, disabled, style, className = "" },
    ref
  ) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={`relative rounded-2xl border border-black/25 shadow-[0_10px_24px_rgba(0,0,0,0.28)]
                    transition active:scale-[0.99] ${highlight ? "ring-4 ring-yellow-300/70" : ""} ${className}`}
        style={{ width: layout.platW, height: layout.platH, background: PLATFORM_BG, ...style }}
        aria-label={`Platform ${label}`}
      >
        <div
          className="absolute inset-0 opacity-[0.10] pointer-events-none rounded-2xl"
          style={{
            background:
              "repeating-linear-gradient(45deg, #000, #000 2px, transparent 2px, transparent 6px)",
          }}
        />
        <div className="absolute left-0 right-0 flex justify-center" style={{ top: "34%" }}>
          <span className="text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] text-3xl sm:text-4xl font-extrabold">
            {label}
          </span>
        </div>
      </button>
    );
  });

  const openTutorial = () => {
    if (!enableTutorial) return;
    setTutStep(0);
    setShowTut(true);
  };

  return (
    <>
    <TopHeader
      title="Number Platform"
      progressLabel={`Round ${Math.min(roundIndex + 1, rounds)}/${rounds}`}
      onBack={() => (typeof onExit === "function" ? onExit() : navigate(-1))}
      onShowTutorial={openTutorial}
    />
      {/* === NEW: Tutorial overlay (renders to a portal, not blocked by z-index) === */}
      {enableTutorial && (
        <NumberPlatformTutorial
          open={showTut}
          steps={numberPlatformTourSteps}
          step={tutStep}
          onPrev={() => setTutStep((s) => Math.max(0, s - 1))}
          onNext={() =>
            setTutStep((s) => Math.min(numberPlatformTourSteps.length - 1, s + 1))
          }
          onClose={() => setShowTut(false)}
          modeLabel="Counting"
          targetN={current}
          afterBase={current}
          minN={minN}
          maxN={maxN}
        />
      )}

      <div
        className="relative w-full min-h-[640px] flex flex-col items-center justify-start pt-8 text-white z-10"
        style={{ marginTop: 120, height: "calc(100vh - 72px)", overflowY: "auto" }}
      >
        {/* HUD */}
        <div className="np-hud max-w-6xl flex items-center justify-start px-4 gap-3 self-start ml-6">
          <div className="flex gap-2">
            <span className={hud}>⭐ Points: {score}</span>
            <div className={hud}>❤️ Lives: {lives}</div>
          </div> 
        </div>

        {/* Prompt */}
        <div className="np-prompt mt-4 text-center text-black/90">
          <div className="text-3xl sm:text-4xl font-extrabold">
            Go to <span className="underline">number {correctNext}</span>
          </div>
          <div className="mt-1">
            You’re standing on <strong>{current}</strong>. Reach <strong>{maxN}</strong> to earn a point!
          </div>
        </div>

        {/* ARENA */}
        <div
          className="relative w-full max-w-6xl mt-8"
          style={{ "--arena-h": layout.arenaH, height: "var(--arena-h)" }}
        >
          {/* upper platforms */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 ${layout.topWidthClass} flex items-start justify-between px-4`}
            style={{ top: `calc(${layout.topTop} - ${RAISE_UP_PX}px)`, gap: layout.gap }}
          >
            <Platform
              ref={platLeftRef}
              label={leftValue}
              onClick={() => handlePick("left")}
              disabled={isLocked}
              className="np-platform-left"
            />
            <Platform
              ref={platRightRef}
              label={rightValue}
              onClick={() => handlePick("right")}
              disabled={isLocked}
              className="np-platform-right"
            />
          </div>

          {/* bottom center platform */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: layout.bottomBottom }}>
            <Platform
              ref={platBottomRef}
              label={current}
              highlight
              disabled
              style={{ width: layout.bottomW }}
              className="np-platform-bottom"
            />
          </div>

          {/* avatar */}
          <div
            ref={avatarAnchorRef}
            className="np-avatar pointer-events-none absolute left-1/2 -translate-x-1/2"
            style={{ bottom: layout.avatarBottom }}
            aria-hidden="true"
          >
            <div
              className="transition-transform duration-300 ease-out"
              style={{ transform: `translate(${avatarOffset.x}px, ${avatarOffset.y}px)` }}
            >
              <div className="np-avatar-circle w-[84px] h-[84px] rounded-full border-2 border-white/80 bg-gradient-to-b from-sky-200 to-sky-500 flex items-center justify-center shadow-[0_10px_24px_rgba(0,0,0,0.33)] text-3xl">
                🐟
              </div>
              <div className="text-center mt-1 font-bold text-black/80">You</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
