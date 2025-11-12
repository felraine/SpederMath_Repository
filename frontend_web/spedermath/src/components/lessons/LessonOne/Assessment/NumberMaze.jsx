// src/lessons/lesson1/NumberMaze.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import { postOnce } from "../../../../utils/requestDedupe";
import { currentStudentId } from "../../../../utils/auth";
import { useNavigate } from "react-router-dom";
import NumberMazeTutorial from "../../tutorial/NumberMazeTutorial";

/* ---------------- Header (with Tutorial button) ---------------- */
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

      {/* Right side: Tutorial + Progress */}
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

/** ===== Tuning knobs ===== */
const MAZE_ROWS = 6;
const MAZE_COLS = 6;
const MAX_CELL_PX = 80; // bigger tiles
const SPEED_CELLS_PER_SEC = 5;
const UPSCALE = 1.2;
const BRAID_FRACTION = 0.45;

/** Assessment / Objectives */
const TOTAL_ROUNDS = 10;
const ADAPTIVE = true;
const DEFAULT_MODE = "recognize";
const PASSING_SCORE = 7;


const High = ({ color = "#3F51B5", children }) => (
  <span
    style={{
      color,
      fontWeight: 900,
      textShadow: `0 0 8px ${color}80`,
      filter: "brightness(1.1)",
      transition: "transform 0.2s ease",
      display: "inline-block",
    }}
  >
    {children}
  </span>
);

/** Assets */
const NUM_ASSETS = {
  1: "/photos/number_pngs/number_1.png",
  2: "/photos/number_pngs/number_2.png",
  3: "/photos/number_pngs/number_3.png",
};

/** Player Assets */
const PLAYER_SKINS = [
  "/photos/lesson1/assessment/GREEN_FISH.gif",
  "/photos/lesson1/assessment/PINK_FISH.gif",
  "/photos/lesson1/assessment/STARFISH.gif",
];

const VOICES_MODE_CHANGE = {
  toCounting: "/audio/lesson1/a/switch_to_counting.mp3",
  toRecognition: "/audio/lesson1/a/switch_to_recognition.mp3",
};

/* --- palette --- */
const SEAWEED_FAINT = "rgba(0, 255, 106, 0.61)";

/** ====== AUDIO ====== */
const VOICES_CORRECT = [
  "/audio/lesson1/correct/good_job.mp3",
  "/audio/lesson1/correct/nice_work.mp3",
  "/audio/lesson1/correct/great_work.mp3",
  "/audio/lesson1/correct/doing_great.mp3",
  "/audio/lesson1/correct/awesome_job.mp3",
  "/audio/lesson1/correct/awesome.mp3",
];
const VOICES_WRONG = [
  "/audio/lesson1/wrong/good_try.mp3",
  "/audio/lesson1/wrong/its_okay.mp3",
  "/audio/lesson1/wrong/its_alright.mp3",
];
const VOICES_FIND = {
  1: "/audio/lesson1/find_one.mp3",
  2: "/audio/lesson1/find_two.mp3",
  3: "/audio/lesson1/find_three.mp3",
};

/** Direction helpers */
const DIRS = [
  { k: "N", dr: -1, dc: 0, opp: "S" },
  { k: "S", dr: 1, dc: 0, opp: "N" },
  { k: "W", dr: 0, dc: -1, opp: "E" },
  { k: "E", dr: 0, dc: 1, opp: "W" },
];
const opposite = (d) =>
  d === "up" ? "down" : d === "down" ? "up" : d === "left" ? "right" : d === "right" ? "left" : null;

/* ---------------- Maze generation & helpers (unchanged) ---------------- */
function generateMaze(rows, cols) {
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      N: true,
      E: true,
      S: true,
      W: true,
      visited: false,
    }))
  );
  const inBoundsRC = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;
  const carveBetween = (r1, c1, r2, c2) => {
    if (r2 === r1 - 1 && c2 === c1) {
      grid[r1][c1].N = false;
      grid[r2][c2].S = false;
    } else if (r2 === r1 + 1 && c2 === c1) {
      grid[r1][c1].S = false;
      grid[r2][c2].N = false;
    } else if (c2 === c1 - 1 && r2 === r1) {
      grid[r1][c1].W = false;
      grid[r2][c2].E = false;
    } else if (c2 === c1 + 1 && r2 === r1) {
      grid[r1][c1].E = false;
      grid[r2][c2].W = false;
    }
  };
  const stack = [];
  let current = { r: 0, c: 0 };
  grid[0][0].visited = true;
  stack.push(current);
  while (stack.length) {
    current = stack[stack.length - 1];
    const neighbors = [];
    const dirs = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ];
    for (const d of dirs) {
      const nr = current.r + d.dr,
        nc = current.c + d.dc;
      if (inBoundsRC(nr, nc) && !grid[nr][nc].visited) neighbors.push({ r: nr, c: nc });
    }
    if (neighbors.length) {
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      carveBetween(current.r, current.c, pick.r, pick.c);
      grid[pick.r][pick.c].visited = true;
      stack.push(pick);
    } else stack.pop();
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) grid[r][c].visited = false;
  return grid;
}
const inBounds = (grid, r, c) => r >= 0 && r < grid.length && c >= 0 && c < grid[0].length;
function removeWallBetween(grid, r1, c1, r2, c2) {
  if (!inBounds(grid, r1, c1) || !inBounds(grid, r2, c2)) return;
  if (r2 === r1 - 1 && c2 === c1) {
    grid[r1][c1].N = false;
    grid[r2][c2].S = false;
  } else if (r2 === r1 + 1 && c2 === c1) {
    grid[r1][c1].S = false;
    grid[r2][c2].N = false;
  } else if (c2 === c1 - 1 && r2 === r1) {
    grid[r1][c1].W = false;
    grid[r2][c2].E = false;
  } else if (c2 === c1 + 1 && r2 === r1) {
    grid[r1][c1].E = false;
    grid[r2][c2].W = false;
  }
}
function neighborsOf(grid, r, c) {
  const nbrs = [];
  const cell = grid[r]?.[c];
  if (!cell) return nbrs;
  if (!cell.N) nbrs.push({ r: r - 1, c });
  if (!cell.S) nbrs.push({ r: r + 1, c });
  if (!cell.W) nbrs.push({ r, c: c - 1 });
  if (!cell.E) nbrs.push({ r, c: c + 1 });
  return nbrs;
}
function degreeOf(grid, r, c) {
  return neighborsOf(grid, r, c).length;
}
function listDeadEnds(grid) {
  const out = [];
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[0].length; c++) {
      if (degreeOf(grid, r, c) === 1) out.push({ r, c });
    }
  return out;
}
function openRandomInteriorWalls(grid, p = 0.2) {
  const rows = grid.length,
    cols = grid[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols && grid[r][c].E && Math.random() < p) {
        removeWallBetween(grid, r, c, r, c + 1);
      }
      if (r + 1 < rows && grid[r][c].S && Math.random() < p) {
        removeWallBetween(grid, r, c, r + 1, c);
      }
    }
  }
}
function braidMaze(grid, keepAtLeast = 3, braidFraction = 0.45) {
  let dead = listDeadEnds(grid);
  for (let i = dead.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dead[i], dead[j]] = [dead[j], dead[i]];
  }
  const toOpen = Math.min(Math.max(0, Math.floor(dead.length * braidFraction)), Math.max(0, dead.length - keepAtLeast));
  let opened = 0;
  for (let i = 0; i < dead.length && opened < toOpen; i++) {
    dead = listDeadEnds(grid);
    if (dead.length <= keepAtLeast) break;
    const { r, c } = dead[i % dead.length];
    const cand = DIRS.map((d) => ({ ...d, nr: r + d.dr, nc: c + d.dc })).filter(
      (d) => inBounds(grid, d.nr, d.nc) && grid[r][c][d.k] === true
    );
    if (!cand.length) continue;
    const pick = (cand[Math.random() * cand.length]) | 0;
    const d = cand[pick];
    removeWallBetween(grid, r, c, d.nr, d.nc);
    opened++;
  }
}
function graphDistance(grid, a, b) {
  if (a.r === b.r && a.c === b.c) return 0;
  const rows = grid.length,
    cols = grid[0].length;
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const q = [{ r: a.r, c: a.c, d: 0 }];
  seen[a.r][a.c] = true;
  while (q.length) {
    const { r, c, d } = q.shift();
    for (const n of neighborsOf(grid, r, c)) {
      if (seen[n.r][n.c]) continue;
      if (n.r === b.r && n.c === b.c) return d + 1;
      seen[n.r][n.c] = true;
      q.push({ r: n.r, c: n.c, d });
    }
  }
  return Infinity;
}
const SEAWEED_MAIN = "#368458ff";
const SEAWEED_EDGE = "#307e56ff";
function edgeHash(r, c, edge) {
  let h = 2166136261 ^ (r * 16777619 + c);
  for (let i = 0; i < edge.length; i++) h = Math.imul(h ^ edge.charCodeAt(i), 16777619);
  return Math.abs(h);
}
const SeaweedWall = ({ orientation, length, thickness = 8, amp = 3, wiggles = 2, gloss = true }) => {
  const w = orientation === "h" ? length : thickness;
  const h = orientation === "h" ? thickness : length;
  const long = orientation === "h" ? w : h;
  const mid = (orientation === "h" ? h : w) / 2;
  const seg = long / wiggles;
  let d = `M 0 ${mid}`;
  for (let i = 0; i < wiggles; i++) {
    const x1 = (i + 0.5) * seg;
    const x2 = (i + 1) * seg;
    const off = i % 2 === 0 ? -amp : amp;
    if (orientation === "h") d += ` Q ${x1} ${mid + off}, ${x2} ${mid}`;
    else d += ` Q ${mid + off} ${x1}, ${mid} ${x2}`;
  }
  const gid = `sw-grad-${orientation}-${length}-${thickness}-${amp}-${wiggles}`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2={orientation === "h" ? "100%" : "0%"} y2={orientation === "h" ? "0%" : "100%"}>
          <stop offset="0%" stopColor={SEAWEED_MAIN} />
          <stop offset="100%" stopColor={SEAWEED_EDGE} />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#${gid})`} strokeWidth={thickness - 2} strokeLinecap="round" />
      {gloss && (
        <path
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={Math.max(2, (thickness - 2) * 0.25)}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

/** ===== Corner placement: 3 unique corners get numbers 1..3 + center start ===== */
function pickCornerItemsAndStart(rows, cols) {
  const corners = [
    { r: 0, c: 0 },
    { r: 0, c: cols - 1 },
    { r: rows - 1, c: 0 },
    { r: rows - 1, c: cols - 1 },
  ];
  const numberCorners = [...corners].sort(() => Math.random() - 0.5).slice(0, 3);
  const nums = [1, 2, 3].sort(() => Math.random() - 0.5);
  const items = numberCorners.map((corner, idx) => ({ n: nums[idx], r: corner.r, c: corner.c }));
  const midR = Math.floor(rows / 2),
    midC = Math.floor(cols / 2);
  const centerCandidates = [
    { r: midR, c: midC },
    { r: Math.max(0, midR - 1), c: midC },
    { r: midR, c: Math.max(0, midC - 1) },
    { r: Math.min(rows - 1, midR + 1), c: midC },
    { r: midR, c: Math.min(cols - 1, midC + 1) },
  ];
  const start = centerCandidates[(Math.random() * centerCandidates.length) | 0];
  return { items, start };
}

/** Arrow button */
const ArrowBtn = ({ dir, onPointerDown, onPointerUp }) => {
  const rotation =
    dir === "up" ? -90 :
    dir === "down" ? 90 :
    dir === "left" ? 180 :
    0;

  return (
    <button
      aria-label={dir}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e);
        try {
          e.currentTarget.releasePointerCapture?.(e.pointerId);
        } catch {}
      }}
      onPointerLeave={onPointerUp}
      style={{
        width: 90,
        height: 90,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
        border: "2px solid #2e3a59",
        background: "#f2f4f8",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        touchAction: "none",
        cursor: "pointer",
        transition: "transform 0.1s ease",
        fontSize: 38,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <svg
        viewBox="0 0 24 24"
        width="32"
        height="32"
        style={{ transform: `rotate(${rotation}deg)` }}
        aria-hidden
      >
        <path
          d="M5 12h8l-3.5-3.5L11 7l6 5-6 5-1.5-1.5L13 12H5z"
          fill="#2e3a59"
        />
      </svg>
    </button>
  );
};

function ArrowIcon({ dir = "up", size = 28, color = "#2e3a59" }) {
  const rotation =
    dir === "up" ? 0 :
    dir === "right" ? 90 :
    dir === "down" ? 180 :
    dir === "left" ? 270 : 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <polyline points="6 15 12 9 18 15" />
    </svg>
  );
}

export default function NumberMaze({ onExit, lessonId, onFinish }) {
  const navigate = useNavigate();

  /* -------- Tutorial state -------- */
  const [showTutorial, setShowTutorial] = useState(false);
  const [tStep, setTStep] = useState(0);
  useEffect(() => {
    setShowTutorial(true);
  }, []);
  const closeTutorial = () => {
    setShowTutorial(false);
  };
  const inputLocked = showTutorial;

  /* -------- Core game state -------- */
  const [seed, setSeed] = useState(0);
  const [cellPx, setCellPx] = useState(48);
  const HARDCODED_LESSON_ID = 2;
  const effectiveLessonId = lessonId ?? HARDCODED_LESSON_ID;
  const containerRef = useRef(null);
  const leftRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const [roundLocked, setRoundLocked] = useState(false);

  const [heldDir, setHeldDir] = useState(null);
  const currentDirRef = useRef(null);
  const queuedDirRef = useRef(null);
  const progressRef = useRef(0);
  const animFromRef = useRef({ r: 0, c: 0 });
  const animPosRef = useRef({ top: 0, left: 0 });
  const [animTick, setAnimTick] = useState(0);
  const speedPerMsRef = useRef(SPEED_CELLS_PER_SEC / 1000);

  const [facing, setFacing] = useState("right");
  const facingRef = useRef("right");
  const setFacingIfNeeded = (next) => {
    if (next && next !== facingRef.current) {
      facingRef.current = next;
      setFacing(next);
    }
  };

  const [playerSkin, setPlayerSkin] = useState(null);
  useEffect(() => {
    setPlayerSkin(PLAYER_SKINS[(Math.random() * PLAYER_SKINS.length) | 0]);
  }, []);

  const { grid, start, items } = useMemo(() => {
    const g = generateMaze(MAZE_ROWS, MAZE_COLS);
    braidMaze(g, 3, BRAID_FRACTION);
    openRandomInteriorWalls(g, 0.2);
    const { items, start } = pickCornerItemsAndStart(MAZE_ROWS, MAZE_COLS);
    return { grid: g, start, items };
  }, [seed]);

  const canMove = useCallback(
    (r, c, dir) => {
      const cell = grid[r]?.[c];
      if (!cell) return false;
      if (dir === "up") return !cell.N;
      if (dir === "down") return !cell.S;
      if (dir === "left") return !cell.W;
      if (dir === "right") return !cell.E;
      return false;
    },
    [grid]
  );

  const [player, setPlayer] = useState({ r: 0, c: 0 });
  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  const lastTouchKeyRef = useRef(null);
  useEffect(() => {
    const key = `${player.r},${player.c}`;
    if (lastTouchKeyRef.current && lastTouchKeyRef.current !== key) lastTouchKeyRef.current = null;
  }, [player]);

  const [collected, setCollected] = useState({});
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [mistakesThisRound, setMistakesThisRound] = useState(0);

  useEffect(() => {
    setRound(1);
    setCorrect(0);
    setWrong(0);
    setCountingProgress(1);
    setCollected({});
    setRoundLocked(false);
  }, []);

  const [mode, setMode] = useState(DEFAULT_MODE);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);

  const [countingProgress, setCountingProgress] = useState(1);
  const [afterBase, setAfterBase] = useState(1);
  const [countWrongStreak, setCountWrongStreak] = useState(0);

  const [targetN, setTargetN] = useState(1);
  const [objectiveOrder, setObjectiveOrder] = useState([1, 2, 3]);
  const lastTargetRef = useRef(null);

  const [soundReady, setSoundReady] = useState(false);
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const playingRef = useRef(false);

  const justAdvancedRef = useRef(false);
  const scoredThisRoundRef = useRef(false);

  const playQueued = useCallback(
    (src) => {
      if (!src || !soundReady || inputLocked) return;
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.addEventListener("ended", () => {
          const next = queueRef.current.shift();
          if (next) {
            audioRef.current.src = next;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          } else {
            playingRef.current = false;
          }
        });
      }
      if (playingRef.current) queueRef.current.push(src);
      else {
        playingRef.current = true;
        audioRef.current.src = src;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    },
    [soundReady, inputLocked]
  );

  const playAudio = useCallback(
    (src) => {
      if (!src || !soundReady || inputLocked) return;
      try {
        if (!audioRef.current) audioRef.current = new Audio();
        const a = audioRef.current;
        a.pause();
        a.src = src;
        a.currentTime = 0;
        a.play().catch(() => {});
      } catch {}
    },
    [soundReady, inputLocked]
  );

  useEffect(() => {
    if (soundReady || inputLocked ) return;
    const unlock = () => {
      if (inputLocked) return;
      setSoundReady(true);
      setTimeout(() => {
        if (round <= TOTAL_ROUNDS && targetN) {
          const src = VOICES_FIND[targetN];
          if (src) {
            try {
              if (!audioRef.current) audioRef.current = new Audio();
              const a = audioRef.current;
              a.pause();
              a.src = src;
              a.currentTime = 0;
              a.play().catch(() => {});
            } catch {}
          }
        }
      }, 0);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [soundReady, round, targetN, mode, inputLocked]);

  const prevModeRef = useRef(mode);
  useEffect(() => {
    if (!soundReady || inputLocked) return;
    if (prevModeRef.current !== mode) {
      playAudio(mode === "count" ? VOICES_MODE_CHANGE.toCounting : VOICES_MODE_CHANGE.toRecognition);
      prevModeRef.current = mode;
    }
  }, [mode, soundReady, playAudio, inputLocked]);

  const playRandom = useCallback(
    (arr) => {
      if (!arr || !arr.length) return;
      playAudio(arr[Math.floor(Math.random() * arr.length)]);
    },
    [playAudio]
  );

  /* Responsive sizing & layout (left column wide, maze right) */
  useEffect(() => {
    const handleResize = () => {
      const totalW = containerRef.current?.clientWidth || window.innerWidth || 360;
      const leftW = leftRef.current?.offsetWidth || 380;
      const horizBudget = Math.max(260, totalW - leftW - 40);
      const totalH = window.innerHeight || 600;
      const vertBudget = Math.max(260, totalH - 160);
      const base = Math.floor(Math.min(horizBudget / MAZE_COLS, vertBudget / MAZE_ROWS) * UPSCALE);
      setCellPx(Math.min(MAX_CELL_PX, Math.max(28, base)));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* Reset on new maze */
  useEffect(() => {
    setPlayer({ r: start.r, c: start.c });
    setHeldDir(null);
    currentDirRef.current = null;
    queuedDirRef.current = null;
    progressRef.current = 0;
    animFromRef.current = { r: start.r, c: start.c };
    lastTimeRef.current = null;
    setCollected({});
    setRoundLocked(false);
    justAdvancedRef.current = false;
    scoredThisRoundRef.current = false;
  }, [start, seed]);

  /* Build objective */
  const lastModeRef = useRef(mode);
  const lastRoundRef = useRef(round);
  useEffect(() => {
    const numbersOnBoard = [1, 2, 3].filter((n) => items.some((it) => it?.n === n));
    if (ADAPTIVE) {
      const toCounting = mode === "recognize" && correctStreak >= 3 && wrongStreak === 0;
      if (toCounting) setMode("count");
    }
    lastModeRef.current = mode;
    lastRoundRef.current = round;

    if (mode === "recognize") {
      let pool = numbersOnBoard.slice();
      if (pool.length > 1 && lastTargetRef.current != null) {
        pool = pool.filter((n) => n !== lastTargetRef.current);
        if (pool.length === 0) pool = numbersOnBoard.slice();
      }
      const chosen = pool.length ? pool[(Math.random() * pool.length) | 0] : numbersOnBoard[0] ?? null;
      setObjectiveOrder(numbersOnBoard);
      setTargetN(chosen);
      lastTargetRef.current = chosen;
    } else {
      const bases = [1, 2].filter((n) => numbersOnBoard.includes(n));
      let basePool = bases.slice();
      if (lastTargetRef.current != null && basePool.length > 1) {
        basePool = basePool.filter((b) => b + 1 !== lastTargetRef.current);
        if (basePool.length === 0) basePool = bases.slice();
      }
      const base = basePool.length ? basePool[(Math.random() * basePool.length) | 0] : bases[0] ?? 1;
      const nextTarget = Math.min(base + 1, 3);
      setAfterBase(base);
      setTargetN(nextTarget);
      lastTargetRef.current = nextTarget;
      setCountingProgress(1);
    }
  }, [items, round, mode, correctStreak, wrongStreak, countingProgress]);

  /* Prompt lines */
  useEffect(() => {
    const assessmentDone = round > TOTAL_ROUNDS;
    if (!soundReady || assessmentDone || !targetN || inputLocked) return;
    playAudio(VOICES_FIND[targetN]);
  }, [round, mode, targetN, playAudio, soundReady, inputLocked]);

  const finishedRef = useRef(false);
  useEffect(() => {
    if (round > TOTAL_ROUNDS && !finishedRef.current) {
      finishedRef.current = true;
      if (typeof onFinish === "function") onFinish(correct);
    }
  }, [round, correct, onFinish]);

  /* Keyboard */
  useEffect(() => {
    if (inputLocked) return;
    const keyToDir = (k) => {
      if (k === "arrowup" || k === "w") return "up";
      if (k === "arrowdown" || k === "s") return "down";
      if (k === "arrowleft" || k === "a") return "left";
      if (k === "arrowright" || k === "d") return "right";
      return null;
    };
    const onDown = (e) => {
      const dir = keyToDir(e.key.toLowerCase());
      if (!dir) return;
      e.preventDefault();
      setHeldDir(dir);
      if (currentDirRef.current && dir === opposite(currentDirRef.current)) {
        reverseMidEdge();
      } else {
        queuedDirRef.current = dir;
        if (!currentDirRef.current && canMove(playerRef.current.r, playerRef.current.c, dir)) {
          currentDirRef.current = dir;
          progressRef.current ||= 0;
          animFromRef.current = { ...playerRef.current };
        }
      }
    };
    const onUp = (e) => {
      const dir = keyToDir(e.key.toLowerCase());
      if (!dir) return;
      e.preventDefault();
      if (heldDir === dir) {
        setHeldDir(null);
        queuedDirRef.current = null;
      }
    };
    window.addEventListener("keydown", onDown, { passive: false });
    window.addEventListener("keyup", onUp, { passive: false });
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keydown", onUp);
    };
  }, [heldDir, canMove, inputLocked]);

  /* Touch D-pad */
  const startHold = (dir) => () => {
    if (inputLocked) return;
    setHeldDir(dir);
    if (currentDirRef.current && dir === opposite(currentDirRef.current)) {
      reverseMidEdge();
    } else {
      queuedDirRef.current = dir;
      if (!currentDirRef.current && canMove(playerRef.current.r, playerRef.current.c, dir)) {
        currentDirRef.current = dir;
        progressRef.current ||= 0;
        animFromRef.current = { ...playerRef.current };
      }
    }
  };
  const stopHold = () => {
    if (inputLocked) return;
    setHeldDir(null);
    queuedDirRef.current = null;
  };

  const reverseMidEdge = () => {
    const dir = currentDirRef.current;
    if (!dir) return;
    const from = animFromRef.current;
    const to = stepFrom(from.r, from.c, dir);
    if (!canMove(from.r, from.c, dir)) return;
    animFromRef.current = to;
    currentDirRef.current = opposite(dir);
    progressRef.current = 1 - progressRef.current;
  };

  useEffect(() => {
    const mul = ADAPTIVE ? (correctStreak >= 3 && wrongStreak === 0 ? 1.15 : 1.0) : 1.0;
    speedPerMsRef.current = (SPEED_CELLS_PER_SEC * mul) / 1000;
  }, [correctStreak, wrongStreak]);

  useEffect(() => {
    const loop = (t) => {
      if (lastTimeRef.current == null) lastTimeRef.current = t;
      const dtMs = t - lastTimeRef.current;
      lastTimeRef.current = t;

      const activeHeld = inputLocked ? null : heldDir;
      let dir = currentDirRef.current;
      let prog = progressRef.current;

      if (!dir && heldDir && canMove(playerRef.current.r, playerRef.current.c, heldDir)) {
        dir = currentDirRef.current = heldDir;
        prog = progressRef.current ||= 0;
        animFromRef.current = { ...playerRef.current };
      }

      if (dir && heldDir && heldDir !== dir && heldDir !== opposite(dir)) {
        queuedDirRef.current = heldDir;
      }

      if (dir && heldDir) {
        prog += dtMs * speedPerMsRef.current;
        while (prog >= 1) {
          prog -= 1;
          const from = animFromRef.current;
          const next = stepFrom(from.r, from.c, dir);
          setPlayer(next);
          playerRef.current = next;
          animFromRef.current = next;

          if (
            queuedDirRef.current &&
            queuedDirRef.current !== dir &&
            queuedDirRef.current !== opposite(dir) &&
            canMove(next.r, next.c, queuedDirRef.current)
          ) {
            dir = currentDirRef.current = queuedDirRef.current;
          } else if (!canMove(next.r, next.c, dir)) {
            dir = currentDirRef.current = null;
            prog = 0;
            break;
          }
        }
      }
      if (dir === "left") setFacingIfNeeded("left");
      else if (dir === "right") setFacingIfNeeded("right");

      currentDirRef.current = dir;
      progressRef.current = prog;

      const pos = pixelPos(animFromRef.current, dir, prog, cellPx);
      animPosRef.current = pos;
      setAnimTick((v) => (v + 1) % 100000);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cellPx, heldDir, canMove, inputLocked]);

  function stepFrom(r, c, dir) {
    if (dir === "up") return { r: r - 1, c };
    if (dir === "down") return { r: r + 1, c };
    if (dir === "left") return { r, c: c - 1 };
    if (dir === "right") return { r, c: c + 1 };
    return { r, c };
  }
  function pixelPos(fromCell, dir, prog, cellSize) {
    const baseTop = fromCell.r * cellSize + cellSize * 0.2;
    const baseLeft = fromCell.c * cellSize + cellSize * 0.2;
    const delta = prog * cellSize;
    return {
      top: baseTop + (dir === "down" ? delta : dir === "up" ? -delta : 0),
      left: baseLeft + (dir === "right" ? delta : dir === "left" ? -delta : 0),
    };
  }

  /* Submit to backend */
  const assessStartRef = useRef(null);
  const postedRef = useRef(false);
  useEffect(() => {
    if (round === 1 && assessStartRef.current == null) assessStartRef.current = Date.now();
  }, [round]);

  const submitProgressToBackend = useCallback(async () => {
    const effectiveLessonId = lessonId ?? 2;
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("NumberMaze: no auth token; cannot submit.");
      return;
    }
    const payload = {
      lessonId: effectiveLessonId,
      score: correct,
      status: correct >= PASSING_SCORE ? "COMPLETED" : "FAILED",
      retakes_count: 0,
      timeSpentInSeconds: assessStartRef.current ? Math.max(0, Math.floor((Date.now() - assessStartRef.current) / 1000)) : 0,
    };
    try {
      const baseHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `nm-${currentStudentId()}-${effectiveLessonId}-${Date.now() >> 12}`,
      };
      const key = `submit:${currentStudentId()}:${effectiveLessonId}`;
      const res = await postOnce(key, () =>
        axios.post("http://localhost:8080/api/student-progress/submit", payload, { headers: baseHeaders })
      );
      console.log("Submit OK", res.status);
      postedRef.current = true;
    } catch (err) {
      console.error("Failed to submit student progress:", err?.response?.status, err?.response?.data);
    }
  }, [correct, lessonId]);

  useEffect(() => {
    const done = round > TOTAL_ROUNDS;
    if (done && !postedRef.current) submitProgressToBackend();
  }, [round, submitProgressToBackend]);

  const advanceRound = useCallback(() => {
    if (justAdvancedRef.current) return;
    justAdvancedRef.current = true;
    setRound((r) => r + 1);
    setSeed((s) => s + 1);
    setCollected({});
    setCountingProgress(1);
    setMistakesThisRound(0);
    setRoundLocked(false);
    currentDirRef.current = null;
    queuedDirRef.current = null;
    progressRef.current = 0;
  }, []);

  /* Round logic */
  useEffect(() => {
    if (justAdvancedRef.current) return;
    if (round > TOTAL_ROUNDS) return;
    if (mode === "recognize" && roundLocked) return;

    const hereKey = `${player.r},${player.c}`;
    if (lastTouchKeyRef.current === hereKey) return;

    for (const it of items) {
      if (!it) continue;
      if (collected[it.n]) continue;
      if (it.r === player.r && it.c === player.c) {
        lastTouchKeyRef.current = hereKey;

        if (mode === "recognize") {
          setRoundLocked(true);
          if (it.n === targetN) {
            setCorrect((v) => v + 1);
            setCorrectStreak((s) => s + 1);
            setWrongStreak(0);
            playRandom(VOICES_CORRECT);
          } else {
            setWrong((v) => v + 1);
            setWrongStreak((s) => s + 1);
            setCorrectStreak(0);
            playRandom(VOICES_WRONG);
          }
          setRound((r) => r + 1);
          setSeed((s) => s + 1);
        } else {
          const isCorrect = it.n === targetN;
          if (isCorrect) {
            setCorrect((v) => v + 1);
            setCorrectStreak((s) => s + 1);
            setWrongStreak(0);
            setCountWrongStreak(0);
            playRandom(VOICES_CORRECT);
            advanceRound();
          } else {
            playRandom(VOICES_WRONG);
            setWrong((v) => v + 1);
            setCorrectStreak(0);
            setWrongStreak((s) => s + 1);
            setCountWrongStreak((s) => {
              const next = s + 1;
              if (next >= 2) setMode("recognize");
              return next;
            });
            advanceRound();
          }
        }
        break;
      }
    }
  }, [player, items, collected, mode, round, countingProgress, targetN, playRandom, roundLocked, advanceRound]);

  const assessmentDone = round > TOTAL_ROUNDS;

  /* UI text */
  const modeLabel = ADAPTIVE ? (mode === "recognize" ? "Recognition" : "Counting") : DEFAULT_MODE === "recognize" ? "Recognition" : "Counting";

  const narratorNode = assessmentDone ? (
    <>Great job! You finished all {TOTAL_ROUNDS} rounds.</>
  ) : mode === "recognize" ? (
    <>Find number <High>{targetN}</High>!</>
  ) : (
    <>What comes after <High>{afterBase}</High>?</>
  );

  /* HUD values */
  const mazeWidth = MAZE_COLS * cellPx;
  const mazeHeight = MAZE_ROWS * cellPx;
  const { top: playerPxTop, left: playerPxLeft } = animPosRef.current;

  /* -------- Tutorial steps -------- */
  const tutSteps = [
    {
      selector: '[data-tut="instruction"]',
      placement: "right",
      title: "Read the instruction here",
      body: mode === "recognize" ? "It says: Find number {targetN}. Navigate to that number." : "It says: What comes after {afterBase}? Go to {afterBasePlus}.",
    },
    {
      selector: '[data-tut="move"]',
      placement: "right",
      title: "Use these Move buttons",
      body: "Tap the buttons to go Up, Down, Left, or Right. You can also use Arrow keys or WASD.",
    },
    {
      selector: '[data-tut="board"]',
      placement: "left",
      title: "This is the maze",
      body: "Find a path to the right number. The fish swims along open paths. Try it!",
    },
  ];

  return (
    <>
      <TopHeader
        title="Number Maze"
        progressLabel={`Round ${Math.min(round, TOTAL_ROUNDS)}/${TOTAL_ROUNDS}`}
        onBack={() => navigate(-1)}
        onShowTutorial={() => {
          setTStep(0);
          setShowTutorial(true);
        }}
      />

      <div
        ref={containerRef}
        style={{
          display: "flex",
          gap: 16,
          padding: 12,
          width: "100%",
          height: "calc(100vh - 72px)",      // fill screen under header
          boxSizing: "border-box",
          background: "transparent",
          marginTop: 72,
          alignItems: "flex-start",           // pin content to top
        }}
      >
        {/* Left column fills height, stack sections, bottom-sticky Regenerate */}
        <div
          ref={leftRef}
          style={{
            width: 440,                       // wide like your markup
            minWidth: 380,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Instruction card at very top */}
          <div
            data-tut="instruction"
            style={{
              width: "100%",
              padding: "18px 20px",
              borderRadius: 14,
              border: "3px solid #24304f",
              background: "#eef4ff",
              marginTop: 25,
              marginBottom: 14,
              minHeight: 120,
              boxShadow: "0 6px 18px rgba(0,0,0,0.08) inset",
            }}
            aria-live="polite"
          >
            <div style={{ fontWeight: 900,fontSize: "clamp(16px, 2.2vw, 22px)",letterSpacing: 0.2,color: "#0f1a3a", marginBottom: 6 }}>Instructions:</div>
            <div style={{ fontSize: "50px" , fontWeight:900, lineHeight: 1.05, color: "#0b102b", textWrap: "balance", }}>{narratorNode}</div>
            <div style={{marginTop: 10,fontSize: "clamp(12px, 1.6vw, 16px)",color: "#23335a",opacity: 0.85,}}>
              Use the arrows below to move the fish.
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Move label + D-pad */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 800, marginBottom: 8, width: "100%", fontSize: 16, color: "whitesmoke" }}>Movement Keys</div>
          
          <div
            data-tut="move"
            style={{
              display: "grid",
              gridTemplateColumns: "72px 72px 72px",
              gridTemplateRows: "72px 72px",
              gap: 24,
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <div />
            <ArrowBtn dir="up" onPointerDown={inputLocked ? undefined : startHold("up")} onPointerUp={stopHold} />
            <div />
            <ArrowBtn dir="left" onPointerDown={inputLocked ? undefined : startHold("left")} onPointerUp={stopHold} />
            <ArrowBtn dir="down" onPointerDown={inputLocked ? undefined : startHold("down")} onPointerUp={stopHold} />
            <ArrowBtn dir="right" onPointerDown={inputLocked ? undefined : startHold("right")} onPointerUp={stopHold} />
            </div>

          {/* Bottom bar: Regenerate + score + (optional) finished/back */}
          <button
            onClick={() => { setSeed((s) => s + 1); }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "2px solid #2e3a59",
              background: "#e9f0ff",
              fontWeight: 800,
              width: "60%",
              boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
              marginLeft: "15px",
            }}
          >
            Regenerate
          </button>

          {assessmentDone && (
            <div
              style={{
                padding: "8px 12px",
                background: "#d1fadf",
                border: "1px solid #2e7d32",
                borderRadius: 10,
                fontWeight: 800,
                width: "100%",
                marginBottom: 8,
              }}
            >
              Assessment finished! ✅
            </div>
          )}
          </div>

          {onExit && (
            <button
              onClick={onExit}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "2px solid #555",
                background: "#fff",
                fontWeight: 700,
                width: "100%",
              }}
            >
              Back
            </button>
          )}
        </div>

        {/* Right side: maze pinned to top-right */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start", marginTop: 25, marginLeft: 10 }}>
          <div
            data-tut="board"
            style={{
              position: "relative",
              width: mazeWidth,
              height: mazeHeight,
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              borderRadius: 12,
              overflow: "hidden",
              background: "linear-gradient(180deg, rgba(0,60,100,0.20), rgba(0,40,80,0.20))",
              outline: `2px solid ${SEAWEED_FAINT}`,
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const top = r * cellPx;
                const left = c * cellPx;
                const showN = cell.N;
                const showW = cell.W;
                const showE = c === MAZE_COLS - 1 && cell.E;
                const showS = r === MAZE_ROWS - 1 && cell.S;
                return (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      position: "absolute",
                      top,
                      left,
                      width: cellPx,
                      height: cellPx,
                      background: "linear-gradient(180deg, rgba(0,60,80,0.16), rgba(0,40,60,0.16))",
                      outline: "2px solid rgba(255, 255, 255, 0.35)",
                      borderRadius: 16,
                      boxSizing: "border-box",
                    }}
                  >
                    {showN && (
                      <div style={{ position: "absolute", top: 0, left: 0, width: cellPx, height: 8 }}>
                        <SeaweedWall
                          orientation="h"
                          length={cellPx}
                          thickness={8}
                          amp={2 + (edgeHash(r, c, "N") % 3)}
                          wiggles={2 + (edgeHash(r, c, "Nw") % 2)}
                        />
                      </div>
                    )}
                    {showW && (
                      <div style={{ position: "absolute", top: 0, left: 0, width: 8, height: cellPx }}>
                        <SeaweedWall
                          orientation="v"
                          length={cellPx}
                          thickness={8}
                          amp={2 + (edgeHash(r, c, "W") % 3)}
                          wiggles={2 + (edgeHash(r, c, "Ww") % 2)}
                        />
                      </div>
                    )}
                    {showE && (
                      <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: cellPx }}>
                        <SeaweedWall
                          orientation="v"
                          length={cellPx}
                          thickness={8}
                          amp={2 + (edgeHash(r, c, "E") % 3)}
                          wiggles={2 + (edgeHash(r, c, "Ew") % 2)}
                        />
                      </div>
                    )}
                    {showS && (
                      <div style={{ position: "absolute", left: 0, bottom: 0, width: cellPx, height: 8 }}>
                        <SeaweedWall
                          orientation="h"
                          length={cellPx}
                          thickness={8}
                          amp={2 + (edgeHash(r, c, "S") % 3)}
                          wiggles={2 + (edgeHash(r, c, "Sw") % 2)}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Items */}
            {items.map((it) => {
              if (!it) return null;
              const top = it.r * cellPx;
              const left = it.c * cellPx;
              const size = Math.floor(cellPx * 0.8);
              const offset = Math.floor((cellPx - size) / 2);
              const hidden = !!collected[it.n];
              return (
                <div
                  key={`item-${it.n}`}
                  style={{
                    position: "absolute",
                    top: top + offset,
                    left: left + offset,
                    width: size,
                    height: size,
                    display: hidden ? "none" : "block",
                  }}
                >
                  {NUM_ASSETS[it.n] ? (
                    <img
                      src={NUM_ASSETS[it.n]}
                      alt={`Number ${it.n}`}
                      draggable={false}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "#fff7cc",
                        border: "2px solid #aa8b00",
                        borderRadius: 10,
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: Math.floor(size * 0.5),
                      }}
                    >
                      {it.n}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Player */}
            {playerSkin && (
              <img
                src={playerSkin}
                alt="Player fish"
                draggable={false}
                style={{
                  position: "absolute",
                  top: playerPxTop,
                  left: playerPxLeft,
                  width: cellPx * 0.65,
                  height: cellPx * 0.65,
                  objectFit: "contain",
                  pointerEvents: "none",
                  userSelect: "none",
                  transition: "none",
                  willChange: "top,left",
                  transform: facing === "right" ? "scaleX(-1)" : "scaleX(1)",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Tutorial Overlay (spotlight) */}
      <NumberMazeTutorial
        open={showTutorial}
        steps={tutSteps}
        step={tStep}
        onPrev={() => setTStep((s) => Math.max(0, s - 1))}
        onNext={() => setTStep((s) => Math.min(tutSteps.length - 1, s + 1))}
        onClose={closeTutorial}
        modeLabel={modeLabel}
        targetN={targetN}
        afterBase={afterBase}
      />
    </>
  );
}
