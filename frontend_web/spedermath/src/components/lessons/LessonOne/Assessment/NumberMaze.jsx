// NumberMaze.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import { postOnce } from "../../../../utils/requestDedupe";
import { currentStudentId } from "../../../../utils/auth";

/** ===== Tuning knobs ===== */
const MAZE_ROWS = 6;
const MAZE_COLS = 6;
/** Bigger tiles without changing rows/cols */
const MAX_CELL_PX = 72;
/** Cells per second along a corridor (base). */
const SPEED_CELLS_PER_SEC = 5;
/** Make board a bit larger if space allows */
const UPSCALE = 1.2;
/** How much to "braid" the maze: open extra walls to create loops (0..1). */
const BRAID_FRACTION = 0.45;

/** Assessment / Objectives */
const TOTAL_ROUNDS = 10;            // ← 10 rounds
const ADAPTIVE = true;              // ← toggle adaptive on/off
const DEFAULT_MODE = "recognize";   // start with recognition, then counting if doing well
const SHUFFLE_OBJECTIVES = false;   // used when ADAPTIVE=false && DEFAULT_MODE="recognize"

/** Passing rule for backend fields */
const PASSING_SCORE = 7; // pass if >= 7/10

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
  toCounting: "/audio/lesson1/a/switch_to_counting.mp3",     // "Let's practice counting now."
  toRecognition: "/audio/lesson1/a/switch_to_recognition.mp3", // "Let's practice recognition now."
};

/* --- palette --- */
const SEAWEED       = "rgba(46, 204, 113, 0.78)";
const SEAWEED_FAINT = "rgba(0, 255, 106, 0.61)";

/** ====== AUDIO: WIRED TO YOUR /public/audio PATHS ====== */
/* Success lines (randomized) */
const VOICES_CORRECT = [
  "/audio/lesson1/correct/good_job.mp3",
  "/audio/lesson1/correct/nice_work.mp3",
  "/audio/lesson1/correct/great_work.mp3",
  "/audio/lesson1/correct/doing_great.mp3",
  "/audio/lesson1/correct/awesome_job.mp3",
  "/audio/lesson1/correct/awesome.mp3",
];
/* Gentle wrong (randomized) */
const VOICES_WRONG = [
  "/audio/lesson1/wrong/good_try.mp3",
  "/audio/lesson1/wrong/its_okay.mp3",
  "/audio/lesson1/wrong/its_alright.mp3",
];
/* “Find #” prompts */
const VOICES_FIND = {
  1: "/audio/lesson1/find_one.mp3",
  2: "/audio/lesson1/find_two.mp3",
  3: "/audio/lesson1/find_three.mp3",
};
/* Counting sequence nudges (optional; still used for recognition fallback) */
const VOICES_COUNTING_SEQ = {
  2: "/audio/lesson1/now_two.mp3",
  3: "/audio/lesson1/lastly_three.mp3",
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

/** ===== Maze generation (perfect maze) ===== */
function generateMaze(rows, cols) {
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      N: true, E: true, S: true, W: true, visited: false,
    }))
  );

  const inBoundsRC = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;
  const carveBetween = (r1, c1, r2, c2) => {
    if (r2 === r1 - 1 && c2 === c1) { grid[r1][c1].N = false; grid[r2][c2].S = false; }
    else if (r2 === r1 + 1 && c2 === c1) { grid[r1][c1].S = false; grid[r2][c2].N = false; }
    else if (c2 === c1 - 1 && r2 === r1) { grid[r1][c1].W = false; grid[r2][c2].E = false; }
    else if (c2 === c1 + 1 && r2 === r1) { grid[r1][c1].E = false; grid[r2][c2].W = false; }
  };

  const stack = [];
  let current = { r: 0, c: 0 };
  grid[0][0].visited = true;
  stack.push(current);

  while (stack.length) {
    current = stack[stack.length - 1];
    const neighbors = [];
    const dirs = [{ dr:-1, dc:0 }, { dr:1, dc:0 }, { dr:0, dc:-1 }, { dr:0, dc:1 }];
    for (const d of dirs) {
      const nr = current.r + d.dr, nc = current.c + d.dc;
      if (inBoundsRC(nr, nc) && !grid[nr][nc].visited) neighbors.push({ r: nr, c: nc });
    }
    if (neighbors.length) {
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      carveBetween(current.r, current.c, pick.r, pick.c);
      grid[pick.r][pick.c].visited = true;
      stack.push(pick);
    } else {
      stack.pop();
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) grid[r][c].visited = false;
  }
  return grid;
}

// Open extra walls anywhere inside the maze (not just dead-ends).
// p = probability per interior wall to open (0..1).
function openRandomInteriorWalls(grid, p = 0.15) {
  const rows = grid.length, cols = grid[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Check E and S to avoid double-processing the same wall
      if (c + 1 < cols && grid[r][c].E && Math.random() < p) {
        removeWallBetween(grid, r, c, r, c + 1);
      }
      if (r + 1 < rows && grid[r][c].S && Math.random() < p) {
        removeWallBetween(grid, r, c, r + 1, c);
      }
    }
  }
}

/** ===== Graph helpers ===== */
const inBounds = (grid, r, c) => r >= 0 && r < grid.length && c >= 0 && c < grid[0].length;

function removeWallBetween(grid, r1, c1, r2, c2) {
  if (!inBounds(grid, r1, c1) || !inBounds(grid, r2, c2)) return;
  if (r2 === r1 - 1 && c2 === c1) { grid[r1][c1].N = false; grid[r2][c2].S = false; }
  else if (r2 === r1 + 1 && c2 === c1) { grid[r1][c1].S = false; grid[r2][c2].N = false; }
  else if (c2 === c1 - 1 && r2 === r1) { grid[r1][c1].W = false; grid[r2][c2].E = false; }
  else if (c2 === c1 + 1 && r2 === r1) { grid[r1][c1].E = false; grid[r2][c2].W = false; }
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
function degreeOf(grid, r, c) { return neighborsOf(grid, r, c).length; }
function listDeadEnds(grid) {
  const out = [];
  for (let r=0;r<grid.length;r++) for (let c=0;c<grid[0].length;c++) {
    if (degreeOf(grid, r, c) === 1) out.push({ r, c });
  }
  return out;
}

/** Compute BFS distances from start */
function computeDistances(grid, start) {
  const rows = grid.length, cols = grid[0].length;
  const dist = Array.from({ length: rows }, () => Array.from({ length: cols }, () => Infinity));
  const q = [];
  dist[start.r][start.c] = 0;
  q.push(start);
  while (q.length) {
    const { r, c } = q.shift();
    const d = dist[r][c] + 1;
    for (const n of neighborsOf(grid, r, c)) {
      if (dist[n.r][n.c] > d) { dist[n.r][n.c] = d; q.push(n); }
    }
  }
  const farthestCells = [];
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) if (dist[r][c]<Infinity) farthestCells.push({ r, c, d: dist[r][c] });
  farthestCells.sort((a,b)=>b.d-a.d);
  return { dist, farthestCells };
}

function graphDistance(grid, a, b) {
  if (a.r === b.r && a.c === b.c) return 0;
  const rows = grid.length, cols = grid[0].length;
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

/** --- Seaweed walls (SVG, wavy) --- */
const SEAWEED_MAIN  = "#368458ff";
const SEAWEED_EDGE  = "#307e56ff"; //darker

function edgeHash(r, c, edge) {
  let h = 2166136261 ^ (r * 16777619 + c);
  for (let i = 0; i < edge.length; i++) h = Math.imul(h ^ edge.charCodeAt(i), 16777619);
  return Math.abs(h);
}

const SeaweedWall = ({ orientation, length, thickness = 8, amp = 3, wiggles = 2, gloss = true }) => {
  const w = orientation === "h" ? length : thickness;
  const h = orientation === "h" ? thickness : length;
  const long = orientation === "h" ? w : h;
  const mid  = (orientation === "h" ? h : w) / 2;

  const seg = long / wiggles;
  let d = `M 0 ${mid}`;
  for (let i = 0; i < wiggles; i++) {
    const x1 = (i + 0.5) * seg;
    const x2 = (i + 1) * seg;
    const off = (i % 2 === 0 ? -amp : amp);
    if (orientation === "h") d += ` Q ${x1} ${mid + off}, ${x2} ${mid}`;
    else d += ` Q ${mid + off} ${x1}, ${mid} ${x2}`;
  }

  const gid = `sw-grad-${orientation}-${length}-${thickness}-${amp}-${wiggles}`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2={orientation === "h" ? "100%" : "0%"} y2={orientation === "h" ? "0%" : "100%"}>
          <stop offset="0%"   stopColor={SEAWEED_MAIN} />
          <stop offset="100%" stopColor={SEAWEED_EDGE} />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={`url(#${gid})`} strokeWidth={thickness - 2} strokeLinecap="round" />
      {gloss && (
        <path d={d} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={Math.max(2, (thickness - 2) * 0.25)} strokeLinecap="round" />
      )}
    </svg>
  );
};

/** ===== Make more pathways: braid by opening walls on some dead-ends ===== */
function braidMaze(grid, keepAtLeast = 3, braidFraction = 0.45) {
  let dead = listDeadEnds(grid);
  for (let i=dead.length-1;i>0;i--) {
    const j = Math.floor(Math.random()*(i+1));
    [dead[i], dead[j]] = [dead[j], dead[i]];
  }
  const toOpen = Math.min(
    Math.max(0, Math.floor(dead.length * braidFraction)),
    Math.max(0, dead.length - keepAtLeast)
  );
  let opened = 0;
  for (let i=0; i<dead.length && opened < toOpen; i++) {
    dead = listDeadEnds(grid);
    if (dead.length <= keepAtLeast) break;
    const { r, c } = dead[i % dead.length];
    const cand = DIRS
      .map(d => ({...d, nr: r + d.dr, nc: c + d.dc}))
      .filter(d => inBounds(grid, d.nr, d.nc) && grid[r][c][d.k] === true);
    if (!cand.length) continue;
    const pick = cand[Math.floor(Math.random()*cand.length)];
    removeWallBetween(grid, r, c, pick.nr, pick.nc);
    opened++;
  }
}

/** ===== Item placement ===== */
function pickItemsAtDeadEnds(grid, start, distFromStart, k = 3) {
  const rows = grid.length, cols = grid[0].length;
  const minStartDist = Math.max(3, Math.floor((rows + cols) / 3));
  let sepMin = Math.max(3, Math.floor((rows + cols) / 3) + 1);

  const de = [];
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
    const d = distFromStart[r][c];
    if (degreeOf(grid, r, c) === 1 && d >= minStartDist && !(r===start.r && c===start.c)) {
      de.push({ r, c, d });
    }
  }
  de.sort((a,b)=>b.d-a.d);

  const tryPick = (sep) => {
    const picks = [];
    for (const cand of de) {
      if (picks.length >= k) break;
      if (picks.every(p => graphDistance(grid, p, cand) >= sep)) picks.push(cand);
    }
    return picks;
  };

  let chosen = tryPick(sepMin);
  while (chosen.length < k && sepMin > 1) { sepMin--; chosen = tryPick(sepMin); }
  return chosen.slice(0, k);
}

/* ---------- Helpers ---------- */
const cellEq = (a, b) => a && b && a.r === b.r && a.c === b.c;
function randomCell(grid) {
  return { r: Math.floor(Math.random() * grid.length), c: Math.floor(Math.random() * grid[0].length) };
}
function shuffle(arr) {
  if (!Array.isArray(arr)) return [];
  const a = [...arr]; // never mutate caller's array
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}
function ensureItems(grid, start, dist, farthestCells, k, basePicks) {
  const picked = [...basePicks];
  const have = new Set(picked.map(p => `${p.r},${p.c}`));
  const pushIf = (p) => {
    const key = `${p.r},${p.c}`;
    if (!have.has(key) && !cellEq(p, start)) {
      have.add(key);
      picked.push({ r: p.r, c: p.c });
    }
  };

  if (picked.length < k) {
    for (let r = 0; r < grid.length && picked.length < k; r++) {
      for (let c = 0; c < grid[0].length && picked.length < k; c++) {
        if (degreeOf(grid, r, c) === 1) pushIf({ r, c });
      }
    }
  }
  if (picked.length < k) {
    for (const p of farthestCells) {
      if (picked.length >= k) break;
      pushIf(p);
    }
  }
  if (picked.length < k) {
    for (let r = 0; r < grid.length && picked.length < k; r++) {
      for (let c = 0; c < grid[0].length && picked.length < k; c++) {
        if (dist[r][c] < Infinity) pushIf({ r, c });
      }
    }
  }
  return picked.slice(0, k);
}

/** ===== Corner placement: 3 unique corners get numbers 1..3 (random) + start cell ===== */
function pickCornerItemsAndStart(rows, cols) {
  const corners = [
    { label: "TL", r: 0, c: 0 },
    { label: "TR", r: 0, c: cols - 1 },
    { label: "BL", r: rows - 1, c: 0 },
    { label: "BR", r: rows - 1, c: cols - 1 },
  ];

  const shuffled = [...corners].sort(() => Math.random() - 0.5);
  const numberCorners = shuffled.slice(0, 3);

  const nums = [1, 2, 3].sort(() => Math.random() - 0.5);
  const items = numberCorners.map((corner, idx) => ({
    n: nums[idx],
    r: corner.r,
    c: corner.c,
  }));

  // --- new: pick a start somewhere near center
  const midR = Math.floor(rows / 2);
  const midC = Math.floor(cols / 2);
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
const ArrowBtn = ({ label, onPointerDown, onPointerUp }) => (
  <button
    aria-label={label}
    onPointerDown={(e)=>{e.currentTarget.setPointerCapture?.(e.pointerId); onPointerDown?.(e);}}
    onPointerUp={(e)=>{onPointerUp?.(e); try{e.currentTarget.releasePointerCapture?.(e.pointerId);}catch{}}}
    onPointerLeave={onPointerUp}
    style={{
      width: 64, height: 64,
      borderRadius: 12, border: "2px solid #2e3a59",
      background: "#f2f4f8",
      fontSize: 16, fontWeight: 800,
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      touchAction: "none",
    }}
  >
    {label}
  </button>
);

export default function NumberMaze({ onExit, lessonId }) {
  const [seed, setSeed] = useState(0);
  const [cellPx, setCellPx] = useState(48);
  const HARDCODED_LESSON_ID = 2;          // <- change this anytime
  const effectiveLessonId = lessonId ?? HARDCODED_LESSON_ID;
  /** Refs that the loop uses (declare before any effect that uses them) */
  const containerRef = useRef(null);
  const leftRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const [roundLocked, setRoundLocked] = useState(false);

  /** Movement state */
  const [heldDir, setHeldDir] = useState(null);
  const currentDirRef = useRef(null);
  const queuedDirRef = useRef(null);
  const progressRef = useRef(0);
  const animFromRef = useRef({ r: 0, c: 0 });
  const animPosRef = useRef({ top: 0, left: 0 });
  const [animTick, setAnimTick] = useState(0);
  const speedPerMsRef = useRef(SPEED_CELLS_PER_SEC / 1000);

  /** Facing (left/right only) */
  const [facing, setFacing] = useState("right");
  const facingRef = useRef("right");
  const setFacingIfNeeded = (next) => {
    if (next && next !== facingRef.current) {
      facingRef.current = next;
      setFacing(next);
    }
  };

  /** Player skin */
  const [playerSkin, setPlayerSkin] = useState(null);
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * PLAYER_SKINS.length);
    setPlayerSkin(PLAYER_SKINS[randomIndex]);
  }, []);

  /** Maze data */
  const { grid, start, items } = useMemo(() => {
    const g = generateMaze(MAZE_ROWS, MAZE_COLS);
    braidMaze(g, 3, BRAID_FRACTION);            // keeps loops by breaking dead-ends
    openRandomInteriorWalls(g, 0.20);           // ← add this line (tune 0.20–0.45)

    const { items, start } = pickCornerItemsAndStart(MAZE_ROWS, MAZE_COLS);
    return { grid: g, start, items };
  }, [seed]);


  /** canMove (depends on grid, so declare after grid) */
  const canMove = useCallback((r, c, dir) => {
    const cell = grid[r]?.[c];
    if (!cell) return false;
    if (dir === "up") return !cell.N;
    if (dir === "down") return !cell.S;
    if (dir === "left") return !cell.W;
    if (dir === "right") return !cell.E;
    return false;
  }, [grid]);

  /** Player & movement */
  const [player, setPlayer] = useState({ r: 0, c: 0 });
  const playerRef = useRef(player);
  useEffect(()=>{ playerRef.current = player; }, [player]);

  // Prevent repeated triggers while staying on the same tile
  const lastTouchKeyRef = useRef(null);

  // Clear the per-tile lock when you move off that tile
  useEffect(() => {
    const key = `${player.r},${player.c}`;
    if (lastTouchKeyRef.current && lastTouchKeyRef.current !== key) {
      lastTouchKeyRef.current = null;
    }
  }, [player]);

  /** Assessment/collection state */
  const [collected, setCollected] = useState({});
  const [round, setRound] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);

  // One-score-per-round controls for COUNTING (legacy, will be idle but kept)
  const [mistakesThisRound, setMistakesThisRound] = useState(0);

  // Optional: belt-and-suspenders fix for “starts at round 2”
  useEffect(() => {
    // Force a known good starting state on first mount
    setRound(1);
    setCorrect(0);
    setWrong(0);
    setCountingProgress(1);
    setCollected({});
    setRoundLocked(false);
  }, []);

  /** Adaptive state */
  const [mode, setMode] = useState(DEFAULT_MODE); // "count" | "recognize"
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);

  /** Counting progress (legacy sequence within the same round; we keep for compat) */
  const [countingProgress, setCountingProgress] = useState(1);

  /** NEW — After-X counting style state */
  const [afterBase, setAfterBase] = useState(1);           // X in “what comes after X?”
  const [countWrongStreak, setCountWrongStreak] = useState(0); // consecutive wrongs while in counting

  /** Objectives */
  const [targetN, setTargetN] = useState(1);
  const [objectiveOrder, setObjectiveOrder] = useState([1,2,3]);

  /** NEW — Track last asked target to avoid consecutive repeats */
  const lastTargetRef = useRef(null);

  /** ===== Audio: unlock + core player ===== */
  const [soundReady, setSoundReady] = useState(false);
  const audioRef = useRef(null);
  // === Simple audio queue so sounds don't interrupt each other ===
  const queueRef = useRef([]);
  const playingRef = useRef(false);

  const justAdvancedRef = useRef(false);
  const scoredThisRoundRef = useRef(false);

  const playQueued = useCallback((src) => {
    if (!src || !soundReady) return;

    // init the single audio element and wire "ended"
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

    // if something is already playing, enqueue; else start now
    if (playingRef.current) {
      queueRef.current.push(src);
    } else {
      playingRef.current = true;
      audioRef.current.src = src;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [soundReady]);

  const playAudio = useCallback((src) => {
    if (!src || !soundReady) return;
    try {
      if (!audioRef.current) audioRef.current = new Audio();
      const a = audioRef.current;
      a.pause();
      a.src = src;
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch {}
  }, [soundReady]);

  // Unlock audio on first user gesture (and immediately speak the current prompt once)
  useEffect(() => {
    if (soundReady) return;
    const unlock = () => {
      setSoundReady(true);
      // Speak the initial prompt right away once unlocked
      setTimeout(() => {
        if (round <= TOTAL_ROUNDS && targetN) {
          const src = (mode === "recognize")
            ? VOICES_FIND[targetN]
            : (VOICES_COUNTING_SEQ[targetN] || VOICES_FIND[targetN]);
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
  }, [soundReady, round, targetN, mode]);

  // === Mode-change transition line (fires only when mode actually changes) ===
  const prevModeRef = useRef(mode);

  useEffect(() => {
    if (!soundReady) return;               // wait until audio is unlocked
    if (prevModeRef.current !== mode) {
      playAudio(
        mode === "count"
          ? VOICES_MODE_CHANGE.toCounting      // "Let's practice counting now."
          : VOICES_MODE_CHANGE.toRecognition   // "Let's practice recognition now."
      );
      prevModeRef.current = mode;              // update AFTER playing
    }
  }, [mode, soundReady, playAudio]);

  /* Small helper: pick a random line from an array */
  const playRandom = useCallback((arr) => {
    if (!arr || !arr.length) return;
    const pick = arr[Math.floor(Math.random() * arr.length)];
    playAudio(pick);
  }, [playAudio]);

  /** Responsive sizing */
  useEffect(() => {
    const handleResize = () => {
      const totalW = containerRef.current?.clientWidth || window.innerWidth || 360;
      const leftW = leftRef.current?.offsetWidth || 220;
      const horizBudget = Math.max(180, totalW - leftW - 40);

      const totalH = window.innerHeight || 600;
      const vertBudget = Math.max(180, totalH - 160);

      const base = Math.floor(
        Math.min(horizBudget / MAZE_COLS, vertBudget / MAZE_ROWS) * UPSCALE
      );
      setCellPx(Math.min(MAX_CELL_PX, Math.max(28, base)));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /** Reset on new maze / round reset */
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

  /** Build objective for the round (with no-repeat target) */
  const lastModeRef = useRef(mode);
  const lastRoundRef = useRef(round);

  useEffect(() => {
    const numbersOnBoard = [1,2,3].filter(n => items.some(it => it?.n === n));

    if (ADAPTIVE) {
      // Only promote into Counting here; demotion happens in counting logic
      const toCounting = (mode === "recognize") && (correctStreak >= 3 && wrongStreak === 0);
      if (toCounting) setMode("count");
    }

    const modeChanged = lastModeRef.current !== mode;
    const roundChanged = lastRoundRef.current !== round;
    lastModeRef.current = mode;
    lastRoundRef.current = round;

    if (mode === "recognize") {
      // Pick random target from numbersOnBoard, avoiding last target if possible
      let pool = numbersOnBoard.slice();
      if (pool.length > 1 && lastTargetRef.current != null) {
        pool = pool.filter(n => n !== lastTargetRef.current);
        if (pool.length === 0) pool = numbersOnBoard.slice();
      }
      const chosen = pool.length ? pool[(Math.random() * pool.length) | 0] : numbersOnBoard[0] ?? null;

      setObjectiveOrder(numbersOnBoard);
      setTargetN(chosen);
      lastTargetRef.current = chosen;
    } else {
      // COUNTING MODE → “What comes after X?” (X ∈ {1,2} that exist on the board)
      const bases = [1, 2].filter(n => numbersOnBoard.includes(n));
      // Avoid choosing a base that would yield the same target as the previous round (target = base + 1)
      let basePool = bases.slice();
      if (lastTargetRef.current != null && basePool.length > 1) {
        basePool = basePool.filter(b => (b + 1) !== lastTargetRef.current);
        if (basePool.length === 0) basePool = bases.slice();
      }
      const base = basePool.length ? basePool[(Math.random() * basePool.length) | 0] : (bases[0] ?? 1);
      const nextTarget = Math.min(base + 1, 3);

      setAfterBase(base);
      setTargetN(nextTarget);
      lastTargetRef.current = nextTarget;

      // reset legacy counting sequence state to keep other parts stable
      setCountingProgress(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, round, mode, correctStreak, wrongStreak, countingProgress]);

  /** === Prompt lines at round/target changes === */
  useEffect(() => {
    const assessmentDone = round > TOTAL_ROUNDS;
    if (!soundReady || assessmentDone || !targetN) return;
    if (mode === "recognize") {
      playAudio(VOICES_FIND[targetN]);
    } else {
      // Counting mode: reuse "Find #" cue; no new assets required
      playAudio(VOICES_FIND[targetN]);
    }
  }, [round, mode, targetN, playAudio, soundReady]);

  /** Keyboard input */
  useEffect(() => {
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
  }, [heldDir, canMove]);

  /** Touch D-pad */
  const startHold = (dir) => () => {
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
  const stopHold = () => { setHeldDir(null); queuedDirRef.current = null; };

  /** Reverse instantly without snapping (mid-edge) */
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

  /** rAF movement speed (adaptive) */
  useEffect(() => {
    const mul = ADAPTIVE ? (correctStreak >= 3 && wrongStreak === 0 ? 1.15 : 1.0) : 1.0;
    speedPerMsRef.current = (SPEED_CELLS_PER_SEC * mul) / 1000;
  }, [correctStreak, wrongStreak]);

  /** rAF movement loop (and set facing here) */
  useEffect(() => {
    const loop = (t) => {
      if (lastTimeRef.current == null) lastTimeRef.current = t;
      const dtMs = t - lastTimeRef.current;
      lastTimeRef.current = t;

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

          if (queuedDirRef.current && queuedDirRef.current !== dir && queuedDirRef.current !== opposite(dir)
              && canMove(next.r, next.c, queuedDirRef.current)) {
            dir = currentDirRef.current = queuedDirRef.current;
          } else if (!canMove(next.r, next.c, dir)) {
            dir = currentDirRef.current = null;
            prog = 0;
            break;
          }
        }
      }

      // Update facing after resolving dir this frame
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
  }, [cellPx, heldDir, canMove]);

  function stepFrom(r, c, dir) {
    if (dir === "up") return { r: r - 1, c };
    if (dir === "down") return { r: r + 1, c };
    if (dir === "left") return { r, c: c - 1 };
    if (dir === "right") return { r, c: c + 1 };
    return { r, c };
  }

  function pixelPos(fromCell, dir, prog, cellSize) {
    const baseTop  = fromCell.r * cellSize + cellSize * 0.2;
    const baseLeft = fromCell.c * cellSize + cellSize * 0.2;
    const delta = prog * cellSize;
    return {
      top:  baseTop + (dir === "down" ?  delta : dir === "up" ? -delta : 0),
      left: baseLeft + (dir === "right" ? delta : dir === "left" ? -delta : 0),
    };
  }

  /** === Tracking time + submitting to backend (NO localStorage) === */
  const assessStartRef = useRef(null);
  const postedRef = useRef(false);

  // Start the timer when round 1 begins for this run
  useEffect(() => {
    if (round === 1 && assessStartRef.current == null) {
      assessStartRef.current = Date.now();
    }
  }, [round]);

  const submitProgressToBackend = useCallback(async () => {
    const effectiveLessonId = lessonId ?? 2; // hardcoded fallback

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("NumberMaze: no auth token found; cannot submit progress.");
      return;
    }

    const payload = {
      lessonId: effectiveLessonId,
      score: correct,
      status: correct >= PASSING_SCORE ? "COMPLETED" : "FAILED",
      retakes_count: 0,
      timeSpentInSeconds: assessStartRef.current
        ? Math.max(0, Math.floor((Date.now() - assessStartRef.current) / 1000))
        : 0,
    };

    // Optional: peek at JWT
    try {
      const [, b64] = token.split(".");
      console.log("[JWT payload]", JSON.parse(atob(b64)));
    } catch {}

    const baseHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `nm-${currentStudentId()}-${effectiveLessonId}-${Date.now() >> 12}`,
    };

    try {
      const key = `submit:${currentStudentId()}:${effectiveLessonId}`;
      const res = await postOnce(key, () =>
        axios.post(
          "http://localhost:8080/api/student-progress/submit",
          payload,
          { headers: baseHeaders }
        )
      );

      console.log("Submit OK", res.status);
      postedRef.current = true;
    } catch (err) {
      console.error("Failed to submit student progress:", err?.response?.status, err?.response?.data);
    }
  }, [correct, lessonId]);

  // When assessment ends, submit once
  useEffect(() => {
    const done = round > TOTAL_ROUNDS;
    if (done && !postedRef.current) {
      submitProgressToBackend();
    }
  }, [round, submitProgressToBackend]);

  const advanceRound = useCallback((/* success */) => {
    if (justAdvancedRef.current) return; // already advanced this round
    justAdvancedRef.current = true;  
    // success boolean is optional—kept for readability
    setRound(r => r + 1);
    setSeed(s => s + 1);

    // Reset per-round bookkeeping
    setCollected({});
    setCountingProgress(1);
    setMistakesThisRound(0);
    setRoundLocked(false);

    // Make sure movement state is clean for the new maze
    currentDirRef.current = null;
    queuedDirRef.current = null;
    progressRef.current = 0;
  }, []);

  /** Round logic (fixed) */
  useEffect(() => {
    if (justAdvancedRef.current) return;
    if (round > TOTAL_ROUNDS) return;

    // Only block touches when recognition round is locked
    if (mode === "recognize" && roundLocked) return;

    // Prevent repeating while held on the same tile
    const hereKey = `${player.r},${player.c}`;
    if (lastTouchKeyRef.current === hereKey) return;

    for (const it of items) {
      if (!it) continue;
      if (collected[it.n]) continue;

      if (it.r === player.r && it.c === player.c) {
        // Mark this tile as handled until player leaves
        lastTouchKeyRef.current = hereKey;

        if (mode === "recognize") {
          // Lock the whole round after a touch (prevents multi-score)
          setRoundLocked(true);

          if (it.n === targetN) {
            setCorrect(v => v + 1);
            setCorrectStreak(s => s + 1);
            setWrongStreak(0);
            playRandom(VOICES_CORRECT);
          } else {
            setWrong(v => v + 1);
            setWrongStreak(s => s + 1);
            setCorrectStreak(0);
            playRandom(VOICES_WRONG);
          }

          // Advance to next round/new maze
          setRound(r => r + 1);
          setSeed(s => s + 1);
        } else {
          // =========================
          // COUNTING MODE (After-X)
          // =========================
          // Single decision: "What comes after afterBase?" → targetN = afterBase + 1
          const isCorrect = it.n === targetN;

          if (isCorrect) {
            setCorrect(v => v + 1);
            setCorrectStreak(s => s + 1);
            setWrongStreak(0);
            setCountWrongStreak(0);
            playRandom(VOICES_CORRECT);

            // advance (soft-gating)
            advanceRound(true);
          } else {
            playRandom(VOICES_WRONG);

            setWrong(v => v + 1);
            setCorrectStreak(0);
            setWrongStreak(s => s + 1);

            // Track consecutive wrongs while in counting; demote at 2
            setCountWrongStreak(s => {
              const next = s + 1;
              if (next >= 2) {
                setMode("recognize"); // quiet demotion next round
              }
              return next;
            });

            // still advance (soft-gating)
            advanceRound(false);
          }
        }
        break;
      }
    }
  }, [
    player,
    items,
    collected,
    mode,
    round,
    countingProgress,
    targetN,
    playRandom,
    roundLocked,
    advanceRound,
  ]);

  const assessmentDone = round > TOTAL_ROUNDS;

  /** UI text */
  const modeLabel = ADAPTIVE ? (mode === "recognize" ? "Recognition" : "Counting") :
                   (DEFAULT_MODE === "recognize" ? "Recognition" : "Counting");

  const objectiveText = assessmentDone
    ? `Assessment complete!`
    : (mode === "recognize"
        ? `Round ${round}/${TOTAL_ROUNDS} — Find number ${targetN}`
        : `Round ${round}/${TOTAL_ROUNDS} — What comes after ${afterBase}?`);

  const narratorLine = assessmentDone
    ? `Great job! You finished all ${TOTAL_ROUNDS} rounds.`
    : (mode === "recognize"
        ? `Find number ${targetN}!`
        : `What comes after ${afterBase}? Find number ${targetN}!`);

  /** HUD values */
  const mazeWidth = MAZE_COLS * cellPx;
  const mazeHeight = MAZE_ROWS * cellPx;
  const { top: playerPxTop, left: playerPxLeft } = animPosRef.current;

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        gap: 16,
        padding: 12,
        width: "100%",
        boxSizing: "border-box",
        background: "transparent",
      }}
    >
      {/* Left controls */}
      <div ref={leftRef} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Objectives / Assessment panel */}
        <div
          style={{
            width: 220,
            padding: "10px 12px",
            borderRadius: 12,
            border: "2px solid #2e3a59",
            background: "#eef4ff",
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6 }}>{objectiveText}</div>
          <div style={{ fontSize: 12, lineHeight: 1.3 }}>{narratorLine}</div>
        </div>

        <div style={{ fontWeight: 800, marginBottom: 8 }}>Move</div>

        <div style={{ display: "grid", gridTemplateColumns: "64px 64px 64px", gridTemplateRows: "64px 64px", gap: 6 }}>
          <div />
          <ArrowBtn label="Up" onPointerDown={startHold("up")} onPointerUp={stopHold} />
          <div />
          <ArrowBtn label="Left" onPointerDown={startHold("left")} onPointerUp={stopHold} />
          <ArrowBtn label="Down" onPointerDown={startHold("down")} onPointerUp={stopHold} />
          <ArrowBtn label="Right" onPointerDown={startHold("right")} onPointerUp={stopHold} />
        </div>

        <div style={{ height: 12 }} />
        <button
          onClick={() => { setSeed((s) => s + 1); }}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "2px solid #2e3a59",
            background: "#e9f0ff",
            fontWeight: 800,
          }}
        >
          Regenerate
        </button>

        <div style={{ marginTop: 12, fontSize: 12, textAlign: "center" }}>
          Score: <span style={{ fontWeight: 800 }}>{correct}</span> correct • <span style={{ fontWeight: 800 }}>{wrong}</span> wrong
        </div>

        {assessmentDone && (
          <div
            style={{
              marginTop: 8,
              padding: "6px 10px",
              background: "#d1fadf",
              border: "1px solid #2e7d32",
              borderRadius: 8,
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Assessment finished! ✅
          </div>
        )}

        {onExit && (
          <>
            <div style={{ height: 8 }} />
            <button
              onClick={onExit}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "2px solid #555",
                background: "#fff",
                fontWeight: 700,
              }}
            >
              Back
            </button>
          </>
        )}
      </div>

      {/* Center wrapper — keeps maze centered */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {/* Maze board */}
        <div
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
              const showE = c === MAZE_COLS - 1 && cell.E;  // outer rim only
              const showS = r === MAZE_ROWS - 1 && cell.S;  // outer rim only

              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    position: "absolute",
                    top, left,
                    width: cellPx, height: cellPx,
                    background: "linear-gradient(180deg, rgba(0,60,80,0.16), rgba(0,40,60,0.16))",
                    outline: "2px solid rgba(255, 255, 255, 0.35)",
                    borderRadius: 16,
                    boxSizing: "border-box",
                  }}
                >
                  {/* North wall */}
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

                  {/* West wall */}
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

                  {/* East wall (only on outer rim) */}
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

                  {/* South wall (only on outer rim) */}
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
                    style={{ width: "100%", height: "100%", objectFit: "contain", userSelect: "none", pointerEvents: "none" }}
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

          {/* Player fish */}
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
  );
}
