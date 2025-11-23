// src/lessons/lesson2/NumberDrop.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { currentStudentId } from "../../../../utils/auth";
import { postOnce } from "../../../../utils/requestDedupe";

export default function NumberDrop({
  maxNumber = 5,
  onGameOver,                 // parent Assessment will show the result screen
  lessonId = 4,
  dashboardPath = "/dashboard",
  passThreshold = null,
}) {
  const BASE_W = 560;
  const BASE_H = 640;
  const BASKET_W = 90;
  const BASKET_H = 90;
  const NUM_SIZE = 50;
  const INITIAL_LIVES = 3;
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Keep 5 rounds; parent will scale to /10 on its own
  const TOTAL_ROUNDS = 5;

  const TARGET_PROB = 0.65;
  const SPEED_MIN = 2;
  const SPEED_STEP = 0.2;
  const SPEED_MAX = 3;
  const ROUND_START_DELAY_MS = 700;
  const BASE_DROP_VY = 110;

  const PASS_THRESHOLD = passThreshold ?? Math.ceil(TOTAL_ROUNDS * 0.7); // 4 of 5

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

  const rafRef       = useRef(null);
  const lastTsRef    = useRef(null);
  const wrapRef      = useRef(null);
  const containerRef = useRef(null);
  const hudRef       = useRef(null);
  const hudVHRef     = useRef(0);

  const basketXRef   = useRef(BASE_W / 2 - BASKET_W / 2);
  const draggingRef  = useRef(false);
  const dropRef      = useRef(null);
  const imgsRef      = useRef({});
  const basketElRef  = useRef(null);
  const numberElRef  = useRef(null);

  const gameStartRef = useRef(null);
  const submittedRef = useRef(false);

  // 🔐 live mirror of score so we don't submit with stale state
  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);

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
      score, // 0..5
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
      fetch(`${API_BASE}/api/student-progress/submit`, {
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

  const finishGame = useCallback(() => {
    setRunning(false);
    if (submittedRef.current) return;

    // Wait a tick for React to flush the last score update,
    // then compute the final values, then delay submit slightly.
    setTimeout(() => {
      const total = TOTAL_ROUNDS;
      const finalScore = scoreRef.current; // latest score (0..5)
      const passed = finalScore >= PASS_THRESHOLD;
      const status = passed ? "COMPLETED" : "FAILED";
      const durationSec = gameStartRef.current
        ? Math.max(0, Math.round((Date.now() - gameStartRef.current) / 1000))
        : 0;

      setFinished({ score: finalScore, total, passed, status, durationSec });
      dropRef.current = null;

      setTimeout(() => {
        if (submittedRef.current) return;
        submittedRef.current = true;

        console.log("[NumberDrop] Submitting final (delayed):", finalScore, "/", total, status);
        submitProgress({ score: finalScore, status, durationSec });
        onGameOver?.({ score: finalScore, total, wrongs, rounds: TOTAL_ROUNDS, status, durationSec });
      }, 400); // slight guard to ensure UI/state are fully settled
    }, 50); // allow setScore to flush before reading scoreRef
  }, [PASS_THRESHOLD, TOTAL_ROUNDS, onGameOver, submitProgress, wrongs]);

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
    scoreRef.current = 0; // keep ref in sync
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

  const debugSubmitPerfect = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRunning(false);
    if (submittedRef.current) return;

    const total = TOTAL_ROUNDS;
    const forcedScore = 5; // perfect for a 0..5 game
    const durationSec = 150;
    const passed = forcedScore >= PASS_THRESHOLD;
    const status = passed ? "COMPLETED" : "FAILED";

    scoreRef.current = forcedScore;
    setFinished({ score: forcedScore, total, passed, status, durationSec });
    dropRef.current = null;

    setTimeout(() => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      submitProgress({ score: forcedScore, status, durationSec });
      onGameOver?.({ score: forcedScore, total, wrongs, rounds: TOTAL_ROUNDS, status, durationSec });
    }, 0);
  }, [PASS_THRESHOLD, TOTAL_ROUNDS, onGameOver, submitProgress, wrongs]);

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
              // ✅ bump score, sync ref, then slightly delay to advance
              setScore((s) => {
                const ns = s + 1;
                scoreRef.current = ns;
                return ns;
              });
              dropRef.current = null;
              setTimeout(() => advanceRound(), 50); // allow setScore to flush
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

  return (
    <div ref={wrapRef} className="w-screen h-screen flex items-center justify-center overflow-hidden">
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

      {/* DEV debug */}
      {((typeof process !== "undefined" && process.env.NODE_ENV !== "production") ||
        (typeof window !== "undefined" && window.location.search.includes("?debug=1"))) && (
        <button
          onClick={debugSubmitPerfect}
          className="absolute top-3 right-3 z-50 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white border border-white/30 font-extrabold text-xs shadow opacity-90"
          title="Force-submit 5/5, 150s"
        >
          DEV: Submit 5/5
        </button>
      )}

      <div
        ref={containerRef}
        className="relative"
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
        <div ref={hudRef} className="p-3 flex flex-col gap-3 text-white w-full max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr_220px] items-center gap-3 sm:gap-2 text-center sm:text-left">
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

        {/* Basket */}
        <img
          ref={basketElRef}
          src="/sprites/ufo.png"
          alt="ufo"
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

        {/* Start overlay (kept) */}
        {!started && !finished && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 text-[#0b3a66]">
            <div className="text-center">
              <img
                src="/sprites/ufo.png"
                alt="ufo"
                className="w-30 h-30 mx-auto mb-2.5 select-none"
                draggable={false}
                style={{ width: 120, height: 120 }}
              />
              <div className="text-2xl font-black mb-2.5">Catch the numbers in order!</div>
              <button
                onClick={startGame}
                className="px-6 py-3 rounded-lg bg-green-500 text-white font-extrabold shadow"
              >
                Start
              </button>
            </div>
          </div>
        )}

        {/* No finish overlay here — parent Assessment handles it */}
      </div>
    </div>
  );
}
