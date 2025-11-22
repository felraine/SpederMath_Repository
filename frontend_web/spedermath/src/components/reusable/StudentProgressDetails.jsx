import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import ReactApexChart from "react-apexcharts";

/** Small nav button */
const NavBtn = ({ disabled, onClick, children, ariaLabel }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className={`px-3 py-1.5 rounded-lg border text-sm transition
      ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 active:scale-95"}
    `}
  >
    {children}
  </button>
);

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/** Safe number helpers */
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const firstNum = (...vals) => {
  for (const v of vals) {
    const n = toNum(v);
    if (n !== null && n >= 0) return n;
  }
  return null;
};

export default function StudentAttemptDetails({ studentId }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!studentId) return;
    let ignore = false;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (!ignore) setErr("Not authenticated. Please log in again.");
          return;
        }

        const res = await axios.get(`${API_BASE}/api/attempts/${studentId}/recent`, {
          params: { limit: 40, type: "ASSESSMENT", _ts: Date.now() },
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res?.data ?? [];
        const list =
          Array.isArray(data) ? data :
          Array.isArray(data.items) ? data.items :
          Array.isArray(data.results) ? data.results :
          Array.isArray(data.content) ? data.content :
          [];

        // newest → oldest (we’ll reverse per-lesson for the chart)
        list.sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt));

        if (!ignore) setAttempts(list);
      } catch (e) {
        console.error("[Attempts API] error:", e);
        if (!ignore) {
          setErr(e?.response?.status === 401
            ? "Session expired or unauthorized. Please log in again."
            : "Failed to load assessment attempts."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [studentId]);

  // Sort key per lesson: prefer lessonOrder, else earliest attempt time
  const getLessonSortKey = (list) => {
    const first = list?.[0] || {};
    const order = toNum(first.lessonOrder);
    if (order !== null) return order;

    const times = list
      .map(a => new Date(a.attemptedAt || a.createdAt || a.timestamp || 0).getTime())
      .filter(t => Number.isFinite(t));
    return times.length ? Math.min(...times) : Number.MAX_SAFE_INTEGER;
  };

  /** Build lessons[] with:
   * - maxScore (robustly derived)
   * - unlockThreshold (for the current lesson)
   * - nextUnlockThreshold (target to unlock the next lesson)
   */
  const lessons = useMemo(() => {
    const m = new Map();
    for (const a of attempts) {
      const id = a.lessonId ?? "unknown";
      if (!m.has(id)) m.set(id, []);
      m.get(id).push(a);
    }

    // Derive per-lesson info
    const arr = [...m.entries()].map(([lessonId, list]) => {
      const first = list[0];

      // --- derive maxScore robustly ---
      const attemptMaxes = list.map(a => toNum(a.maxScore)).filter(v => v !== null && v > 0);
      const scorePeaks  = list.map(a => toNum(a.score)).filter(v => v !== null && v >= 0);
      const derivedMax =
        (attemptMaxes.length ? Math.max(...attemptMaxes) : 0) ??
        0;

      const maxScore =
        (attemptMaxes.length ? Math.max(...attemptMaxes) : 0) ||
        toNum(first?.maxScore) ||
        (scorePeaks.length ? Math.max(10, Math.max(...scorePeaks)) : 10);

      // --- derive this lesson's unlockThreshold (current lesson) ---
      const perAttemptThresholds = list
        .map(a => firstNum(
          a.unlockThreshold, a.unlock_threshold,
          a.unlockTarget,    a.unlock_target,
          a.passThreshold,   a.passingScore,
          a.targetScore
        ))
        .filter(v => v !== null && v >= 0);

      const unlockThreshold =
        (perAttemptThresholds.length ? perAttemptThresholds.at(-1) : null) ||
        firstNum(
          first?.unlockThreshold, first?.unlock_threshold,
          first?.unlockTarget,    first?.unlock_target,
          first?.passThreshold,   first?.passingScore,
          first?.targetScore
        ) ||
        Math.round(maxScore * 0.8); // default if nothing provided

      return {
        lessonId,
        title: first?.lessonTitle || `Lesson ${lessonId}`,
        maxScore,
        unlockThreshold,
        list,
        sortKey: getLessonSortKey(list),
      };
    });

    // Order by lessonOrder/time
    arr.sort((A, B) => (A.sortKey ?? 0) - (B.sortKey ?? 0));

    // Compute nextUnlockThreshold for each lesson
    const FINAL_LESSON_FALLBACK_GOAL = 3;

    for (let i = 0; i < arr.length; i++) {
    const next = arr[i + 1];
    arr[i].nextUnlockThreshold = next
      ? (
          toNum(next.unlockThreshold) ??
          toNum(arr[i].unlockThreshold) ??
          toNum(arr[i].maxScore) ??
          10
        )
      : FINAL_LESSON_FALLBACK_GOAL;
    }

    return arr;
  }, [attempts]);

  /** AI summary that includes:
   *  - last/best/avgScore/avgTime
   *  - this lesson's unlockThreshold & maxScore
   *  - next lesson's unlock threshold (nextUnlockThreshold)
   */
  const buildSummary = useCallback(() => {
    if (!lessons.length) return "No assessment attempts.";
    const mean = (arr)=> arr.length ? (arr.reduce((s,v)=>s+v,0)/arr.length) : 0;

    const parts = lessons.map((L, i) => {
      const list = [...L.list].sort((a,b)=>new Date(a.attemptedAt)-new Date(b.attemptedAt));
      const nAttempts = list.length;
      const scores = list.map(x => Number(x.score||0));
      const times  = list.map(x => Number(x.timeSpentSeconds||0));
      const last = scores.at(-1) ?? 0;
      const prev = scores.length>1 ? scores.at(-2) : null;
      const trend = prev==null ? "no-trend" : (last>prev ? "up" : last<prev ? "down" : "flat");
      const best = Math.max(...scores, 0);
      const avgS = Math.round(mean(scores));
      const avgT = Math.round(mean(times));

      return [
        `Assessment ${i+1} "${L.title}"`,
        `attempts=${nAttempts}`,
        `last=${last}`,
        `best=${best}`,
        `avgScore=${avgS}`,
        `avgTimeSec=${avgT}`,
        `maxScore=${L.maxScore}`,                   // ← include maxScore
        `unlockThreshold=${L.unlockThreshold}`,     // ← include current lesson threshold (context)
        `nextUnlockThreshold=${L.nextUnlockThreshold}`, // ← include NEXT lesson target
        `trend=${trend}`
      ].join(", ");
    });

    return parts.join(" | ") + " | Overall: compare last/avg against NEXT lesson’s unlock threshold; use maxScore for ceiling context.";
  }, [lessons]);

  // Expose to window for your StudentCard button / Assessment modal
  useEffect(() => {
    window.spederBuildSummary = buildSummary;
    return () => { delete window.spederBuildSummary; };
  }, [buildSummary]);

  // UI state & keyboard nav
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (idx >= lessons.length) setIdx(Math.max(0, lessons.length - 1));
  }, [lessons.length, idx]);

  const onKey = useCallback((e) => {
    if (!lessons.length) return;
    if (e.key === "ArrowLeft") setIdx(i => Math.max(0, i - 1));
    if (e.key === "ArrowRight") setIdx(i => Math.min(lessons.length - 1, i + 1));
  }, [lessons.length]);
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  if (!studentId) return null;
  if (loading) return <div className="text-sm text-gray-600">Loading attempts…</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;
  if (!lessons.length) return <div className="text-sm text-gray-500">No ASSESSMENT attempts yet.</div>;

  const canPrev = idx > 0;
  const canNext = idx < lessons.length - 1;
  const current = lessons[idx];

  // Use the precomputed NEXT lesson threshold
  const goalFromNext = current.nextUnlockThreshold;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">Lesson {idx + 1} / {lessons.length}</div>
        <div className="flex items-center gap-2">
          <NavBtn onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={!canPrev} ariaLabel="Previous lesson">
            ← Prev
          </NavBtn>
          <NavBtn onClick={() => setIdx(i => Math.min(lessons.length - 1, i + 1))} disabled={!canNext} ariaLabel="Next lesson">
            Next →
          </NavBtn>
        </div>
      </div>

      <LessonAttemptsChart
        key={`${current.lessonId}-${current.list.length}-${goalFromNext}`} // force remount when goal changes
        title={current.title}
        list={current.list}
        goalScore={goalFromNext}
        maxScore={current.maxScore}
      />
      <div className="text-[11px] text-gray-500">
        Goal line uses the <span className="font-medium">next lesson’s</span> unlock threshold.
        {!lessons[idx + 1] && " (This is the last lesson—fallback used.)"}
      </div>
    </div>
  );
}

/* ====================== Per-Lesson Apex Chart ====================== */

function LessonAttemptsChart({ title, list, goalScore = 10, maxScore = 10 }) {
  const [showTime, setShowTime] = React.useState(false);

  const prepared = React.useMemo(() => {
    return [...list].reverse().slice(-10).map((a, i) => {
      const d = new Date(a.attemptedAt);
      return {
        label: isNaN(d.getTime())
          ? `#${i + 1}`
          : d.toLocaleString([], {
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }),
        score: Number(a.score ?? 0),
        seconds: Number(a.timeSpentSeconds ?? 0),
      };
    });
  }, [list]);

  const categories = prepared.map((d) => d.label);
  const scoreData = prepared.map((d) => d.score);
  const timeData = prepared.map((d) => d.seconds);
  const timeNulls = React.useMemo(
    () => new Array(timeData.length).fill(null),
    [timeData.length]
  );

  if (!scoreData.length) {
    return (
      <div className="border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-[11px] text-gray-500">
              Score over recent attempts
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={showTime}
              onChange={(e) => setShowTime(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Show time
          </label>
        </div>
        <div className="h-[300px] grid place-items-center text-sm text-gray-500">
          No attempts yet.
        </div>
      </div>
    );
  }

  const lastScore = scoreData.at(-1) ?? 0;

  // === Y-axis max logic ===
  // For small assessments (maxScore ≤ 5), pin axis max to 6.
  // Otherwise, give ~10% headroom (but never below 10).
  const basePeak = Math.max(goalScore, ...scoreData, maxScore);
  const axisMax =
    maxScore <= 5 ? 6 : Math.max(10, Math.ceil(basePeak * 1.1));

  const options = {
    chart: {
      type: "line",
      toolbar: { show: false },
      animations: { easing: "easeinout", speed: 250 },
    },
    colors: ["#0ea5e9", "#94a3b8"], // score line, time bars
    stroke: { width: [3, 0], curve: "smooth" },
    markers: {
      size: 4,
      strokeWidth: 2,
      hover: { size: 7 },
      colors: ["#0ea5e9"],
      strokeColors: "#ffffff",
      discrete: [],
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      categories,
      labels: { style: { fontSize: "12px" }, rotate: -10 },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      { title: { text: "Score" }, min: 0, max: axisMax, decimalsInFloat: 0 },
      {
        opposite: true,
        show: showTime,
        title: { text: "Seconds" },
        min: 0,
        max: Math.ceil((Math.max(0, ...timeData) || 10) * 1.15),
        decimalsInFloat: 0,
      },
    ],
    plotOptions: { bar: { columnWidth: "42%", borderRadius: 6 } },
    legend: { show: false },
    tooltip: {
      theme: "dark",
      shared: true,
      y: {
        formatter: (val, ctx) =>
          ctx.seriesIndex === 0 ? `${val} pts` : `${val}s`,
      },
    },
    annotations: {
      yaxis: [
        {
          y: goalScore,
          borderColor: "#16a34a",
          strokeDashArray: 4,
          label: {
            text: `Goal: ${goalScore}`,
            borderColor: "#16a34a",
            position: "left",
            offsetX: -8,
            offsetY: 6,
            style: {
              background: "#a7f3d0",
              color: "#065f46",
              fontSize: "11px",
              fontWeight: 700,
            },
          },
        },
      ],
      points: [
        {
          x: categories[categories.length - 1],
          y: scoreData[scoreData.length - 1],
          marker: { size: 6, fillColor: "#0ea5e9", strokeColor: "#0ea5e9" },
          label: {
            text: `Last: ${lastScore}`,
            offsetX: 12,
            offsetY: -16,
            style: { background: "#e0f2fe", color: "#075985", fontWeight: 700 },
          },
        },
      ],
    },
  };

  const series = [
    { name: "Score", type: "line", data: scoreData },
    { name: "Time (s)", type: "column", data: showTime ? timeData : timeNulls },
  ];

  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-[11px] text-gray-500">
            {showTime
              ? "Score = line • Time = bars"
              : "Score over recent attempts"}
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showTime}
            onChange={(e) => setShowTime(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Show time
        </label>
      </div>

      <div className="w-full" style={{ height: 300 }}>
        <ReactApexChart options={options} series={series} height={300} />
      </div>

      <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500">
        <span>Showing last 10 attempts (oldest → newest).</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: "#0ea5e9" }}
            />
            Score
          </span>
          {showTime && (
            <span className="inline-flex items-center gap-1 text-xs">
              <span
                className="inline-block h-2.5 w-2.5 rounded"
                style={{ background: "#94a3b8" }}
              />
              Seconds
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
