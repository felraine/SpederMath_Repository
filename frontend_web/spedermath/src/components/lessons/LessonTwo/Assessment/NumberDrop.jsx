// src/lessons/NumberDrop.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "../../../css/numberdrop.css";

/**
 * NumberDrop (mobile-friendly, with Munchie, Start screen, distractors, lives)
 * - 10 rounds total
 * - Lives hitting 0 advances to next round
 * - Score only increments when the full sequence (1..maxNumber) is completed
 * - HUD: fixed-width lives, no 'Wrongs' shown
 * - Pace: slow at first; speeds up per round; capped at SPEED_MAX
 * - On finish: pass/fail results overlay + backend submit
 */
export default function NumberDrop({
  maxNumber = 5,
  onGameOver,                 // optional: parent callback
  lessonId = 4,                   // <-- REQUIRED for backend submit
  dashboardPath = "/dashboard",
  passThreshold = null,       // optional override; default = ceil(0.7 * TOTAL_ROUNDS)
}) {
  // ---- CONFIG ----
  const BASE_W = 560; // virtual space (physics)
  const BASE_H = 640;

  const BASKET_W = 90;
  const BASKET_H = 90;
  const NUM_SIZE = 50;

  const INITIAL_LIVES = 3;
  const TOTAL_ROUNDS = 10;

  // Probability the next drop is the CURRENT TARGET
  const TARGET_PROB = 0.65;

  // Pace controls
  const SPEED_MIN = 2;      // gentle start
  const SPEED_STEP = 0.20;    // per-round increase
  const SPEED_MAX = 3;     // hard cap so it never gets too fast
  const ROUND_START_DELAY_MS = 700; // a brief breather before each round starts

  // Initial drop velocity (before multiplier)
  const BASE_DROP_VY = 110;

  // Passing threshold (default 70% of rounds)
  const PASS_THRESHOLD = passThreshold ?? Math.ceil(TOTAL_ROUNDS * 0.7);

  // ---- UI State (not updated per-frame) ----
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(1); // 1..TOTAL_ROUNDS
  const [currentTarget, setCurrentTarget] = useState(1);
  const [dropValue, setDropValue] = useState(1);
  const [score, setScore] = useState(0); // rounds cleared
  const [wrongs, setWrongs] = useState(0); // tracked internally, hidden in HUD
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [scale, setScale] = useState(1);
  const [lastLostFlash, setLastLostFlash] = useState(0);

  // Finish overlay payload
  const [finished, setFinished] = useState(null);
  // { score, total: TOTAL_ROUNDS, passed: boolean, status: 'PASSED'|'FAILED', durationSec: number }

  // ---- Refs (mutable per-frame state) ----
  const rafRef       = useRef(null);
  const lastTsRef    = useRef(null);
  const wrapRef      = useRef(null);
  const containerRef = useRef(null);

  const hudRef = useRef(null);
  const hudVHRef = useRef(0);

  const basketXRef   = useRef(BASE_W / 2 - BASKET_W / 2);
  const draggingRef  = useRef(false);

  // Current falling thing: { x, y, vy, value, isTarget }
  const dropRef      = useRef(null);
  const imgsRef      = useRef({}); // number -> HTMLImageElement

  // DOM elements we move imperatively
  const basketElRef  = useRef(null);
  const numberElRef  = useRef(null);

  // track overall session time for backend
  const gameStartRef = useRef(null);

  // ---------- Responsive scaling ----------
  useEffect(() => {
    const compute = () => {
      const parentW = window.innerWidth;
      const parentH = window.innerHeight;
      const s = Math.min(parentW / BASE_W, parentH / BASE_H);
      setScale(s);
    };
    compute();

    const ro = new ResizeObserver(compute);
    ro.observe(document.body);
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
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
    // With TARGET_PROB, drop the real target; otherwise pick any other (distractor)
    if (Math.random() < TARGET_PROB) return { value: target, isTarget: true };
    const choices = Array.from({ length: maxNumber }, (_, i) => i + 1).filter(n => n !== target);
    const value = choices[Math.floor(Math.random() * choices.length)];
    return { value, isTarget: false };
  }, [maxNumber]);

  // Per-round speed factor
  const speedFactorForRound = useCallback((r) => {
    const steps = Math.max(0, (r ?? 1) - 1);
    const factor = SPEED_MIN + steps * SPEED_STEP;
    return Math.min(SPEED_MAX, factor);
  }, []);

  // Spawn at random X
  const spawnDrop = useCallback((target) => {
    const { value, isTarget } = pickNextValue(target);
    const margin = 12;
    const minX = margin;
    const maxX = BASE_W - NUM_SIZE - margin;
    const x = Math.random() * (maxX - minX) + minX;

    // start just below the HUD, with a little gap
    const startY = Math.max(hudVHRef.current + 8, 0);

    dropRef.current = { x, y: startY, vy: BASE_DROP_VY, value, isTarget };
    setDropValue(value);

    if (numberElRef.current) {
      numberElRef.current.style.left = `${x}px`;
      numberElRef.current.style.top  = `${startY}px`;
      numberElRef.current.src = `/photos/number_pngs/number_${value}.png`;
    }
  }, [pickNextValue]);

  // ---- Lives in a ref for immediate reads in callbacks ----
  const livesRef = useRef(INITIAL_LIVES);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  

  // ---- Backend submit ----
  const submitProgress = useCallback(async ({ score, status, durationSec }) => {
    const lessonId = 4;
    try {
      if (!lessonId) {
        console.warn("[NumberDrop] Missing lessonId; skipping backend submit.");
        return;
      }
      // Try some common token keys; adjust to your app’s auth storage
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt") ||
        null;

      const payload = {
        lessonId: lessonId,
        score,
        status, // "PASSED" | "FAILED"
        retakes_count: 0,
        timeSpentInSeconds: durationSec,
      };

      const headers = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://localhost:8080/api/student-progress/submit", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Backend submit failed:", res.status, text);
      }
    } catch (err) {
      console.error("Backend submit error:", err);
    }
  }, [lessonId]);

  // ---- Round advancement / finish ----
  const finishGame = useCallback(() => {
    setRunning(false);

    const total = TOTAL_ROUNDS;
    const passed = score >= PASS_THRESHOLD;
    const status = passed ? "COMPLETED" : "FAILED";
    const durationSec = gameStartRef.current
      ? Math.max(0, Math.round((Date.now() - gameStartRef.current) / 1000))
      : 0;

    // show results overlay
    setFinished({ score, total, passed, status, durationSec });

    // clear drop
    dropRef.current = null;

    // Submit to backend and notify parent (deferred to avoid React warnings)
    setTimeout(() => {
      submitProgress({ score, status, durationSec });
      onGameOver?.({ score, total, wrongs, rounds: TOTAL_ROUNDS, status, durationSec });
    }, 0);
  }, [PASS_THRESHOLD, TOTAL_ROUNDS, onGameOver, submitProgress, score, wrongs]);

  const advanceRound = useCallback(() => {
    setRound((r) => {
      const next = r + 1;
      if (next > TOTAL_ROUNDS) {
        finishGame();
        return r; // keep last
      }
      // reset per-round state
      setCurrentTarget(1);
      setLives(INITIAL_LIVES);
      // reposition basket to center for each round (optional)
      basketXRef.current = BASE_W / 2 - BASKET_W / 2;
      if (basketElRef.current) basketElRef.current.style.left = `${basketXRef.current}px`;
      // spawn first target for the new round after a short breather
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
      // Count one wrong, then go to next round
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
    setFinished(null); // hide results overlay if present
    setStarted(true);
    setRunning(true);
    resetForStart();
    gameStartRef.current = Date.now();
    // gentle delay so the Start overlay can fade
    setTimeout(() => spawnDrop(1), 300);
  };

  // ---- Debug: force perfect score submit ----
const debugSubmitPerfect = useCallback(() => {
  // stop animation/game
  if (rafRef.current) cancelAnimationFrame(rafRef.current);
  setRunning(false);

  const total = TOTAL_ROUNDS;
  const score = 10;            // force perfect
  const durationSec = 150;     // force 150s
  const passed = score >= PASS_THRESHOLD;
  const status = passed ? "COMPLETED" : "FAILED";

  // show results overlay immediately
  setFinished({ score, total, passed, status, durationSec });

  // clear any active drop
  dropRef.current = null;

  // submit + notify parent on next tick
  setTimeout(() => {
    submitProgress({ score, status, durationSec });
    onGameOver?.({ score, total, wrongs, rounds: TOTAL_ROUNDS, status, durationSec });
  }, 0);
}, [PASS_THRESHOLD, TOTAL_ROUNDS, onGameOver, submitProgress, wrongs]);


  // ---------- Keyboard controls (desktop) ----------
  useEffect(() => {
    const onKey = (e) => {
      if (!running) return;
      const speed = 18;
      if (e.key === "ArrowLeft") {
        basketXRef.current = Math.max(0, basketXRef.current - speed);
      } else if (e.key === "ArrowRight") {
        basketXRef.current = Math.min(BASE_W - BASKET_W, basketXRef.current + speed);
      }
      if (basketElRef.current) {
        basketElRef.current.style.left = `${basketXRef.current}px`;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  // ---------- Touch/Mouse drag (scale-aware) ----------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getLocalX = (pageX) => {
      const rect = el.getBoundingClientRect();
      const px = pageX - rect.left;   // pixels within scaled box
      const vx = px / scale;          // convert to virtual coords
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

  // ---------- Game loop (rAF + direct style writes) ----------
  useEffect(() => {
    if (!ready || !running) return;

    const tick = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      const drop = dropRef.current;
      if (drop) {
        // round-based speed scaling (predictable)
        const speedScale = speedFactorForRound(round);

        // optional tiny air resistance
        drop.vy *= 0.999;
        drop.y += drop.vy * speedScale * dt;

        // Paint number position
        if (numberElRef.current) {
          numberElRef.current.style.left = `${drop.x}px`;
          numberElRef.current.style.top  = `${drop.y}px`;
        }

        // Collision with basket?
        const bx = basketXRef.current;
        const by = BASE_H - 12 - BASKET_H;
        const overlapX = drop.x < bx + BASKET_W && drop.x + NUM_SIZE > bx;
        const overlapY = drop.y + NUM_SIZE > by && drop.y < by + BASKET_H;

        if (overlapX && overlapY) {
          if (drop.isTarget) {
            // Correct catch
            const next = currentTarget + 1;
            setCurrentTarget(next);

            if (next > maxNumber) {
              // Finished the sequence for this round → score +1, then next round
              setScore((s) => s + 1);
              advanceRound();
              dropRef.current = null;
            } else {
              spawnDrop(next);
            }
          } else {
            // Caught a distractor → lose life, same target continues
            loseOneLife();
            spawnDrop(currentTarget);
          }
        }

        // Fell past bottom
        if (drop && drop.y > BASE_H + NUM_SIZE) {
          if (drop.isTarget) {
            // Missing a target should cost a life
            loseOneLife();
          }
          // In both cases, spawn new for the same target
          spawnDrop(currentTarget);
        }
      }

      // Keep basket visually synced
      if (basketElRef.current) basketElRef.current.style.left = `${basketXRef.current}px`;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready, running, round, currentTarget, maxNumber, spawnDrop, advanceRound, loseOneLife, speedFactorForRound]);

  // ---- Render ----
  const isFlashing = Date.now() - lastLostFlash < 180;

  // Render fixed 3 heart slots to avoid HUD shifts
  const HeartRow = ({ lives }) => {
    const slots = INITIAL_LIVES; // fixed slots
    return (
      <span style={{ display: "inline-flex", gap: 4 }}>
        {Array.from({ length: slots }).map((_, i) => (
          <span key={i} style={{ width: 20, display: "inline-block", textAlign: "center" }}>
            {i < lives ? "❤️" : "🤍"}
          </span>
        ))}
      </span>
    );
  };

  const restartGame = () => {
    startGame();
  };

  const goToDashboard = () => {
    window.location.href = dashboardPath;
  };

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >

      {/* DEV-only debug button */}
{((typeof process !== "undefined" && process.env.NODE_ENV !== "production") ||
  (typeof window !== "undefined" && window.location.search.includes("debug=1"))) && (
  <button
    onClick={debugSubmitPerfect}
    style={{
      position: "absolute",
      top: 12,
      right: 12,
      zIndex: 50,
      padding: "6px 10px",
      background: "#111827",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.35)",
      borderRadius: 10,
      fontWeight: 800,
      fontSize: 12,
      boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
      opacity: 0.9,
    }}
    title="Force-submit 10/10, 150s"
  >
    DEV: Submit 10/10
  </button>
)}

      <div
        ref={containerRef}
        className="nd-area"
        style={{
          width: BASE_W,
          height: BASE_H,
          transform: `scale(${scale})`,
          transformOrigin: "center",
          outline: isFlashing ? "3px solid rgba(255,0,0,0.7)" : "none",
          position: "relative",
        }}
        aria-label="Number Drop Game"
      >
        {/* HUD */}
        <div
          ref={hudRef}
          className="nd-hud"
          style={{
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Top row: Left (Round) • Center (Sequence) • Right (Lives + Score) */}
          <div
            className="nd-row"
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr 220px", // fixed left/right widths to prevent shifts
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* Left: Round */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="nd-label">Round:</span>
              <span className="nd-score" style={{ fontWeight: 800 }}>
                {round}/{TOTAL_ROUNDS}
              </span>
            </div>

            {/* Center: Sequence */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                className="nd-seq"
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {Array.from({ length: maxNumber }, (_, i) => i + 1).map((n) => (
                  <span
                    key={n}
                    className={`nd-seq-num ${n < currentTarget ? "done" : n === currentTarget ? "current" : ""}`}
                    style={{
                      minWidth: 28,
                      height: 28,
                      lineHeight: "28px",
                      textAlign: "center",
                      borderRadius: 6,
                      padding: "0 6px",
                    }}
                  >
                    {n}
                  </span>
                ))}
              </span>
            </div>
            
            

            {/* Right: Lives + Score */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                justifyContent: "flex-end",
              }}
            >
              <span className="nd-label">Lives:</span>
              <HeartRow lives={lives} />
              <div style={{ width: 1, height: 18, background: "rgba(0,0,0,0.15)" }} />
              <span className="nd-label">Score:</span>
              <span className="nd-score" style={{ fontWeight: 800 }}>{score}</span>
            </div>
          </div>
        </div>

        {/* Basket = Munchie */}
        <img
          ref={basketElRef}
          src="/munchie/eyelessneutral_Munchie.png"
          alt="Munchie"
          className="nd-basket"
          style={{ left: basketXRef.current, width: BASKET_W, height: BASKET_H }}
          draggable={false}
        />

        {/* Falling number */}
        {ready && (
          <img
            ref={numberElRef}
            src={`/photos/number_pngs/number_${dropValue}.png`}
            alt="Falling number"
            className="nd-number"
            style={{ width: NUM_SIZE, height: NUM_SIZE, left: 0, top: -NUM_SIZE }}
            draggable={false}
          />
        )}

        {!ready && <div className="nd-loading">Loading numbers…</div>}

        {/* Start overlay */}
        {!started && !finished && (
          <div
            className="nd-finish"
            style={{ background: "rgba(255,255,255,0.5)", color: "#0b3a66" }}
          >
            <div style={{ textAlign: "center" }}>
              <img
                src="/munchie/eyelessneutral_Munchie.png"
                alt="Munchie"
                style={{ width: 120, height: 120, margin: "0 auto 10px" }}
                draggable={false}
              />
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
                Catch the numbers in order! (10 rounds)
              </div>
              <button
                onClick={startGame}
                className="px-6 py-3 rounded-lg"
                style={{
                  background: "#22c55e",
                  color: "#fff",
                  fontWeight: 800,
                  boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
                }}
              >
                Start
              </button>
            </div>
          </div>
        )}

        {/* Finish overlay with pass/fail + actions */}
        {finished && (
          <div
            className="nd-finish"
            style={{
              background: "rgba(0,0,0,0.45)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: 24,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: 16,
                padding: 20,
                minWidth: 320,
                boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                backdropFilter: "blur(6px)",
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 8 }}>
                {finished.passed ? "🎉 You Passed!" : "Keep Trying!"}
              </div>
              <div style={{ opacity: 0.9, marginBottom: 12 }}>
                Rounds cleared: <b>{finished.score}</b> / {finished.total}
              </div>
              <div style={{ opacity: 0.8, marginBottom: 18 }}>
                Time: {finished.durationSec}s
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  onClick={restartGame}
                  className="px-6 py-3 rounded-lg"
                  style={{
                    background: "#22c55e",
                    color: "#fff",
                    fontWeight: 800,
                    boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
                    minWidth: 140,
                  }}
                >
                  Restart
                </button>
                <button
                  onClick={goToDashboard}
                  className="px-6 py-3 rounded-lg"
                  style={{
                    background: "transparent",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.5)",
                    fontWeight: 800,
                    minWidth: 180,
                  }}
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
