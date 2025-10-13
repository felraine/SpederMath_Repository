// src/lessons/lesson2/NumberDrop.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { currentStudentId } from "../../../../utils/auth";
import { postOnce } from "../../../../utils/requestDedupe";

/**
 * NumberDrop (Tailwind version, no external CSS)
 * - 10 rounds total
 * - Lives hit 0 → next round
 * - Score increments only when sequence (1..maxNumber) is completed
 * - Uses guards + idempotency to avoid double submits
 */
export default function NumberDrop({
  maxNumber = 5,
  onGameOver,                 // optional
  lessonId = 4,               // honored
  dashboardPath = "/dashboard",
  passThreshold = null,       // default ceil(0.7 * TOTAL_ROUNDS)
}) {
  // ---- CONFIG ----
  const BASE_W = 560;
  const BASE_H = 640;

  const BASKET_W = 90;
  const BASKET_H = 90;
  const NUM_SIZE = 50;

  const INITIAL_LIVES = 3;
  const TOTAL_ROUNDS = 10;

  const TARGET_PROB = 0.65;

  const SPEED_MIN = 2;
  const SPEED_STEP = 0.2;
  const SPEED_MAX = 3;
  const ROUND_START_DELAY_MS = 700;

  const BASE_DROP_VY = 110;

  const PASS_THRESHOLD = passThreshold ?? Math.ceil(TOTAL_ROUNDS * 0.7);

  // ---- UI State ----
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(1);
  const [currentTarget, setCurrentTarget] = useState(1);
  const [dropValue, setDropValue] = useState(1);
  const [score, setScore] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [scale, setScale] = useState(1);
  const [lastLostFlash, setLastLostFlash] = useState(0);

  const [finished, setFinished] = useState(null);

  // ---- Refs ----
  const rafRef       = useRef(null);
  const lastTsRef    = useRef(null);
  const wrapRef      = useRef(null);
  const containerRef = useRef(null);

  const hudRef = useRef(null);
  const hudVHRef = useRef(0);

  const basketXRef   = useRef(BASE_W / 2 - BASKET_W / 2);
  const draggingRef  = useRef(false);

  const dropRef      = useRef(null);
  const imgsRef      = useRef({});

  const basketElRef  = useRef(null);
  const numberElRef  = useRef(null);

  const gameStartRef = useRef(null);
  const submittedRef = useRef(false);

  // ---------- Responsive scaling ----------
  useEffect(() => {
    const compute = () => {
      const parentW = window.innerWidth;
      const parentH = window.innerHeight;
      const s = Math.min(parentW / BASE_W, parentH / BASE_H);
      setScale(s);
    };
    compute();

    const onResize = () => compute();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  // Recompute HUD height whenever scale changes (or on mount)
  useEffect(() => {
    const updateHudVH = () => {
      if (!hudRef.current || !containerRef.current) return;
      const hudRect = hudRef.current.getBoundingClientRect();
      const contRect = containerRef.current.getBoundingClientRect();
      const hudBottomPx = hudRect.bottom - contRect.top;
      hudVHRef.current = Math.max(0, hudBottomPx / scale);
    };
    updateHudVH();
    window.addEventListener("resize", updateHudVH);
    window.addEventListener("orientationchange", updateHudVH);
    return () => {
      window.removeEventListener("resize", updateHudVH);
      window.removeEventListener("orientationchange", updateHudVH);
    };
  }, [scale]);

  // ---------- Load number images ----------
  useEffect(() => {
    let loaded = 0;
    const need = Math.max(1, Math.min(5, maxNumber));
    for (let v = 1; v <= need; v++) {
      const img = new Image();
      img.src = `/photos/number_pngs/number_${v}.png`;
      img.onload = () => {
        imgsRef.current[v] = img;
        if (++loaded === need) setReady(true);
      };
      img.onerror = () => {
        imgsRef.current[v] = img;
        if (++loaded === need) setReady(true);
      };
    }
  }, [maxNumber]);

  // ---------- Helpers ----------
  const pickNextValue = useCallback((target) => {
    if (Math.random() < TARGET_PROB) return { value: target, isTarget: true };
    const choices = Array.from({ length: maxNumber }, (_, i) => i + 1).filter(n => n !== target);
    const value = choices[Math.floor(Math.random() * choices.length)];
    return { value, isTarget: false };
  }, [maxNumber]);

  const speedFactorForRound = useCallback((r) => {
    const steps = Math.max(0, (r ?? 1) - 1);
    const factor = SPEED_MIN + steps * SPEED_STEP;
    return Math.min(SPEED_MAX, factor);
  }, []);

  const spawnDrop = useCallback((target) => {
    const { value, isTarget } = pickNextValue(target);
    const margin = 12;
    const minX = margin;
    const maxX = BASE_W - NUM_SIZE - margin;
    const x = Math.random() * (maxX - minX) + minX;

    const startY = Math.max(hudVHRef.current + 8, 0);

    dropRef.current = { x, y: startY, vy: BASE_DROP_VY, value, isTarget };
    setDropValue(value);

    if (numberElRef.current) {
      numberElRef.current.style.left = `${x}px`;
      numberElRef.current.style.top  = `${startY}px`;
      numberElRef.current.src = `/photos/number_pngs/number_${value}.png`;
    }
  }, [pickNextValue]);

  const livesRef = useRef(INITIAL_LIVES);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  const makeIdempotencyKey = useCallback(() => {
    const sid = currentStudentId();
    const ymd = new Date().toISOString().slice(0, 10);
    return `spm:${sid}:${lessonId}:${ymd}`;
  }, [lessonId]);

  // ---- Backend submit (deduped) ----
  const submitProgress = useCallback(async ({ score, status, durationSec }) => {
    if (!lessonId) {
      console.warn("[NumberDrop] Missing lessonId; skipping backend submit.");
      return;
    }
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt") ||
      null;

    const payload = {
      lessonId,
      score,
      status, // "COMPLETED" | "FAILED"
      retakes_count: 0,
      timeSpentInSeconds: durationSec,
      idempotencyKey: makeIdempotencyKey(),
    };

    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return postOnce(`submit:${payload.idempotencyKey}`, () =>
      fetch("http://localhost:8080/api/student-progress/submit", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("Backend submit failed:", res.status, text);
        }
        return res;
      })
    );
  }, [lessonId, makeIdempotencyKey]);

  // ---- Round advancement / finish ----
  const finishGame = useCallback(() => {
    setRunning(false);

    if (submittedRef.current) return; // guard
    const total = TOTAL_ROUNDS;
    const passed = score >= PASS_THRESHOLD;
    const status = passed ? "COMPLETED" : "FAILED";
    const durationSec = gameStartRef.current
      ? Math.max(0, Math.round((Date.now() - gameStartRef.current) / 1000))
      : 0;

    setFinished({ score, total, passed, status, durationSec });
    dropRef.current = null;

    setTimeout(() => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      submitProgress({ score, status, durationSec });
      onGameOver?.({ score, total, wrongs, rounds: TOTAL_ROUNDS, status, durationSec });
    }, 0);
  }, [PASS_THRESHOLD, TOTAL_ROUNDS, onGameOver, submitProgress, score, wrongs]);

  const advanceRound = useCallback(() => {
    setRound((r) => {
      const next = r + 1;
      if (next > TOTAL_ROUNDS) {
        finishGame();
        return r;
      }
      setCurrentTarget(1);
      setLives(INITIAL_LIVES);
      basketXRef.current = BASE_W / 2 - BASKET_W / 2;
      if (basketElRef.current) basketElRef.current.style.left = `${basketXRef.current}px`;
      setTimeout(() => spawnDrop(1), ROUND_START_DELAY_MS);
      return next;
    });
  }, [TOTAL_ROUNDS, finishGame, spawnDrop]);

  const loseOneLife = useCallback(() => {
    setLastLostFlash(Date.now());
    const prevLives = livesRef.current;
    const newLives = prevLives - 1;
    const hitZero = newLives <= 0;

    if (hitZero) {
      setWrongs((w) => w + 1);
      advanceRound();
    } else {
      setLives(newLives);
    }
  }, [advanceRound]);

  const resetForStart = () => {
    setRound(1);
    setCurrentTarget(1);
    setScore(0);
    setWrongs(0);
    setLives(INITIAL_LIVES);
    lastTsRef.current = null;
    basketXRef.current = BASE_W / 2 - BASKET_W / 2;
    if (basketElRef.current) basketElRef.current.style.left = `${basketXRef.current}px`;
  };

  const startGame = () => {
    setFinished(null);
    setStarted(true);
    setRunning(true);
    resetForStart();
    gameStartRef.current = Date.now();
    submittedRef.current = false;
    setTimeout(() => spawnDrop(1), 300);
  };

  // Debug: force perfect
  const debugSubmitPerfect = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRunning(false);

    if (submittedRef.current) return;
    const total = TOTAL_ROUNDS;
    const forcedScore = 10;
    const durationSec = 150;
    const passed = forcedScore >= PASS_THRESHOLD;
    const status = passed ? "COMPLETED" : "FAILED";

    setFinished({ score: forcedScore, total, passed, status, durationSec });
    dropRef.current = null;

    setTimeout(() => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      submitProgress({ score: forcedScore, status, durationSec });
      onGameOver?.({ score: forcedScore, total, wrongs, rounds: TOTAL_ROUNDS, status, durationSec });
    }, 0);
  }, [PASS_THRESHOLD, TOTAL_ROUNDS, onGameOver, submitProgress, wrongs]);

  // ---------- Keyboard controls ----------
  useEffect(() => {
    const onKey = (e) => {
      if (!running) return;
      const speed = 18;
      if (e.key === "ArrowLeft") {
        basketXRef.current = Math.max(0, basketXRef.current - speed);
      } else if (e.key === "ArrowRight") {
        basketXRef.current = Math.min(BASE_W - BASKET_W, basketXRef.current + speed);
      }
      if (basketElRef.current) basketElRef.current.style.left = `${basketXRef.current}px`;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  // ---------- Touch/Mouse drag ----------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getLocalX = (pageX) => {
      const rect = el.getBoundingClientRect();
      const px = pageX - rect.left;
      const vx = px / scale;
      return Math.max(0, Math.min(BASE_W - BASKET_W, vx - BASKET_W / 2));
    };

    const onDown = (e) => {
      if (!running) return;
      draggingRef.current = true;
      const pageX = e.touches ? e.touches[0].pageX : e.pageX;
      basketXRef.current = getLocalX(pageX);
      if (basketElRef.current) basketElRef.current.style.left = `${basketXRef.current}px`;
    };
    const onMove = (e) => {
      if (!draggingRef.current || !running) return;
      const pageX = e.touches ? e.touches[0].pageX : e.pageX;
      basketXRef.current = getLocalX(pageX);
      if (basketElRef.current) basketElRef.current.style.left = `${basketXRef.current}px`;
    };
    const onUp = () => { draggingRef.current = false; };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    el.addEventListener("touchstart", onDown, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);

    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);

      el.removeEventListener("touchstart", onDown);
      el.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [scale, running]);

  // ---------- Game loop ----------
  useEffect(() => {
    if (!ready || !running) return;

    const tick = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const drop = dropRef.current;
      if (drop) {
        const speedScale = speedFactorForRound(round);
        drop.vy *= 0.999;
        drop.y += drop.vy * speedScale * dt;

        if (numberElRef.current) {
          numberElRef.current.style.left = `${drop.x}px`;
          numberElRef.current.style.top  = `${drop.y}px`;
        }

        const bx = basketXRef.current;
        const by = BASE_H - 12 - BASKET_H;
        const overlapX = drop.x < bx + BASKET_W && drop.x + NUM_SIZE > bx;
        const overlapY = drop.y + NUM_SIZE > by && drop.y < by + BASKET_H;

        if (overlapX && overlapY) {
          if (drop.isTarget) {
            const next = currentTarget + 1;
            setCurrentTarget(next);

            if (next > maxNumber) {
              setScore((s) => s + 1);
              advanceRound();
              dropRef.current = null;
            } else {
              spawnDrop(next);
            }
          } else {
            loseOneLife();
            spawnDrop(currentTarget);
          }
        }

        if (drop && drop.y > BASE_H + NUM_SIZE) {
          if (drop.isTarget) loseOneLife();
          spawnDrop(currentTarget);
        }
      }

      if (basketElRef.current) basketElRef.current.style.left = `${basketXRef.current}px`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready, running, round, currentTarget, maxNumber, spawnDrop, advanceRound, loseOneLife, speedFactorForRound]);

  // ---- Render ----
  const isFlashing = Date.now() - lastLostFlash < 180;

  const HeartRow = ({ lives }) => {
    const slots = INITIAL_LIVES;
    return (
      <span className="inline-flex gap-1">
        {Array.from({ length: slots }).map((_, i) => (
          <span key={i} className="w-5 inline-block text-center">
            {i < lives ? "❤️" : "🤍"}
          </span>
        ))}
      </span>
    );
  };

  const restartGame = () => startGame();
  const goToDashboard = () => { window.location.href = dashboardPath; };

  return (
   
    <div
      ref={wrapRef}
      className="w-screen h-screen flex items-center justify-center overflow-hidden"
      
    >
    {/* Background video */}
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover z-0"
      src="/backgrounds/lesson_two.mp4"
      type="video/mp4"
    />
      {/* DEV-only debug button */}
      {((typeof process !== "undefined" && process.env.NODE_ENV !== "production") ||
        (typeof window !== "undefined" && window.location.search.includes("?debug=1"))) && (
        <button
          onClick={debugSubmitPerfect}
          className="absolute top-3 right-3 z-50 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white border border-white/30 font-extrabold text-xs shadow opacity-90"
          title="Force-submit 10/10, 150s"
        >
          DEV: Submit 10/10
        </button>
      )}

      <div
        ref={containerRef}
        className={`relative`}
        style={{
          width: BASE_W,
          height: BASE_H,
          transform: `scale(${scale})`,
          transformOrigin: "center",
          outline: isFlashing ? "3px solid rgba(255,0,0,0.7)" : "none",
        }}
        aria-label="Number Drop Game"
      >
       {/* HUD */}
      <div
        ref={hudRef}
        className="p-3 flex flex-col gap-3 text-white w-full max-w-5xl mx-auto"
      >
        <div
          className="
            grid grid-cols-1 sm:grid-cols-[180px_1fr_220px]
            items-center gap-3 sm:gap-2 text-center sm:text-left
          "
        >
          {/* Left: Round */}
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <span className="text-sm sm:text-base opacity-90">Round:</span>
            <span className="font-extrabold text-base sm:text-lg">
              {round}/{TOTAL_ROUNDS}
            </span>
          </div>

          {/* Center: Sequence */}
          <div className="flex items-center justify-center flex-wrap gap-1.5">
            <span className="flex gap-1.5 flex-wrap justify-center">
              {Array.from({ length: maxNumber }, (_, i) => i + 1).map((n) => (
                <span
                  key={n}
                  className={[
                    "min-w-7 h-7 sm:min-w-8 sm:h-8 leading-7 sm:leading-8 text-center rounded-md px-1.5 text-xs sm:text-sm",
                    n < currentTarget
                      ? "bg-green-500 text-white font-bold"
                      : n === currentTarget
                      ? "bg-yellow-300 text-slate-900 font-bold"
                      : "bg-white/40 text-white font-semibold",
                  ].join(" ")}
                >
                  {n}
                </span>
              ))}
            </span>
          </div>

          {/* Right: Lives + Score */}
          <div className="flex items-center justify-center sm:justify-end gap-3 flex-wrap">
            <span className="text-sm sm:text-base opacity-90">Lives:</span>
            <HeartRow lives={lives} />
            <div className="hidden sm:block w-px h-[18px] bg-white/30" />
            <span className="text-sm sm:text-base opacity-90">Score:</span>
            <span className="font-extrabold text-base sm:text-lg">{score}</span>
          </div>
        </div>
      </div>


        {/* Basket = Munchie */}
        <img
          ref={basketElRef}
          src="/munchie/eyelessneutral_Munchie.png"
          alt="Munchie"
          className="absolute bottom-3 select-none"
          style={{ left: basketXRef.current, width: BASKET_W, height: BASKET_H }}
          draggable={false}
        />

        {/* Falling number */}
        {ready && (
          <img
            ref={numberElRef}
            src={`/photos/number_pngs/number_${dropValue}.png`}
            alt="Falling number"
            className="absolute select-none"
            style={{ width: NUM_SIZE, height: NUM_SIZE, left: 0, top: -NUM_SIZE }}
            draggable={false}
          />
        )}

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-800">
            Loading numbers…
          </div>
        )}

        {/* Start overlay */}
        {!started && !finished && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 text-[#0b3a66]">
            <div className="text-center">
              <img
                src="/munchie/eyelessneutral_Munchie.png"
                alt="Munchie"
                className="w-30 h-30 mx-auto mb-2.5 select-none"
                draggable={false}
                style={{ width: 120, height: 120 }}
              />
              <div className="text-2xl font-black mb-2.5">
                Catch the numbers in order! (10 rounds)
              </div>
              <button
                onClick={startGame}
                className="px-6 py-3 rounded-lg bg-green-500 text-white font-extrabold shadow"
              >
                Start
              </button>
            </div>
          </div>
        )}

        {/* Finish overlay */}
        {finished && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-center p-6 bg-black/45">
            <div className="bg-white/15 rounded-xl p-5 min-w-80 shadow-2xl backdrop-blur-md">
              <div className="text-[30px] font-black mb-2.5">
                {finished.passed ? "🎉 You Passed!" : "Keep Trying!"}
              </div>
              <div className="opacity-90 mb-3">
                Rounds cleared: <b>{finished.score}</b> / {finished.total}
              </div>
              <div className="opacity-80 mb-4">
                Time: {finished.durationSec}s
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={restartGame}
                  className="px-6 py-3 rounded-lg bg-green-500 text-white font-extrabold shadow min-w-[140px]"
                >
                  Restart
                </button>
                <button
                  onClick={goToDashboard}
                  className="px-6 py-3 rounded-lg bg-transparent text-white border border-white/50 font-extrabold min-w-[180px]"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
