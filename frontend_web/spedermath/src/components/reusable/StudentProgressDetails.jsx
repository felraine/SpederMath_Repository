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

        const res = await axios.get(`http://localhost:8080/api/attempts/${studentId}/recent`, {
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

        // newest → oldest; we’ll reverse per-lesson for chart
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

  // Helper to extract sort key per lesson (only lessonOrder or earliest time)
  const getLessonSortKey = (list) => {
    const first = list?.[0] || {};
    const order = Number(first.lessonOrder);
    if (Number.isFinite(order)) return order;

    // fallback: earliest attempt time
    const times = list
      .map(a => new Date(a.attemptedAt || a.createdAt || a.timestamp || 0).getTime())
      .filter(t => Number.isFinite(t));
    return times.length ? Math.min(...times) : Number.MAX_SAFE_INTEGER;
  };

  // Group attempts by lesson, ordered by lessonOrder asc (then fallback time)
  const lessons = useMemo(() => {
    const m = new Map();
    for (const a of attempts) {
      const id = a.lessonId ?? "unknown";
      if (!m.has(id)) m.set(id, []);
      m.get(id).push(a);
    }

    const arr = [...m.entries()].map(([lessonId, list]) => {
      const first = list[0];
      return {
        lessonId,
        title: first?.lessonTitle || `Lesson ${lessonId}`,
        maxScore: first?.maxScore ?? 10,
        list,
        sortKey: getLessonSortKey(list),
      };
    });

    // Sort ascending by lessonOrder or fallback time
    arr.sort((A, B) => (A.sortKey ?? 0) - (B.sortKey ?? 0));
    return arr;
  }, [attempts]);

  // Build compact per-lesson summary for the AI
  const buildSummary = useCallback(() => {
    if (!lessons.length) return "No assessment attempts.";
    const mean = (arr)=> arr.length ? (arr.reduce((s,v)=>s+v,0)/arr.length) : 0;

    const parts = lessons.map((L, i) => {
      const list = [...L.list].sort((a,b)=>new Date(a.attemptedAt)-new Date(b.attemptedAt));
      const n = list.length;
      const scores = list.map(x => Number(x.score||0));
      const times  = list.map(x => Number(x.timeSpentSeconds||0));
      const last = scores.at(-1) ?? 0;
      const prev = scores.length>1 ? scores.at(-2) : null;
      const trend = prev==null ? "no-trend" : (last>prev ? "up" : last<prev ? "down" : "flat");
      const best = Math.max(...scores, 0);
      const avgS = Math.round(mean(scores));
      const avgT = Math.round(mean(times));
      return `Assessment ${i+1} "${L.title}": attempts=${n}, last=${last}, best=${best}, avgScore=${avgS}, avgTimeSec=${avgT}, trend=${trend}`;
    });

    return parts.join(" | ") + " | Overall: highlight low last scores, down trends, and high times.";
  }, [lessons]);

  // Expose to window for the StudentCard button
  useEffect(() => {
    window.spederBuildSummary = buildSummary;
    return () => { delete window.spederBuildSummary; };
  }, [buildSummary]);

  // Current lesson index + keyboard nav
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
        key={`${current.lessonId}-${current.list.length}-${current.list[0]?.attemptedAt || ""}`}
        title={current.title}
        list={current.list}
        goalScore={current.maxScore}
      />
    </div>
  );
}

/* ====================== Per-Lesson Apex Chart ====================== */

function LessonAttemptsChart({ title, list, goalScore = 10 }) {
  const statusColor = (s) =>
    s === "COMPLETED" ? "#16a34a" :
    s === "FAILED" ? "#dc2626" :
    s === "IN_PROGRESS" ? "#eab308" :
    "#64748b";

  const prepared = useMemo(() => {
    const copy = [...list].reverse().slice(-10);
    return copy.map((a, i) => {
      const d = new Date(a.attemptedAt);
      return {
        label: isNaN(d.getTime())
          ? `#${i + 1}`
          : d.toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
        score: a.score ?? 0,
        seconds: a.timeSpentSeconds ?? 0,
        status: a.status ?? "-",
        ts: a.attemptedAt ?? null,
      };
    });
  }, [list]);

  const categories = prepared.map(d => d.label);
  const scoreData  = prepared.map(d => d.score);
  const timeData   = prepared.map(d => d.seconds);

  const maxScore  = Math.max(goalScore, ...scoreData, 0);
  const maxTime   = Math.max(...timeData, 0);
  const pad = (n) => (n <= 0 ? 0 : Math.ceil(n * 0.1));
  const yLeftMax  = Math.max(maxScore, goalScore) + pad(maxScore);
  const yRightMax = maxTime + pad(maxTime);

  const discreteMarkers = prepared.map((d, i) => ({
    seriesIndex: 0,
    dataPointIndex: i,
    fillColor: statusColor(d.status),
    strokeColor: statusColor(d.status),
    size: 5,
    shape: "circle",
  }));

  const InlineLegend = () => (
    <div className="flex items-center gap-3 text-xs">
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
        Score (points)
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5">
        <span
          className="inline-block h-2.5 w-2.5 rounded"
          style={{ background: "linear-gradient(180deg, rgba(99,102,241,1) 0%, rgba(139,92,246,1) 100%)" }}
        />
        Time (seconds)
      </span>
    </div>
  );

  const options = {
    chart: { type: "line", toolbar: { show: false }, animations: { easing: "easeinout", speed: 300 } },
    colors: ["#10b981", "#6366f1"],
    stroke: { width: [3, 0], curve: "smooth" },
    dataLabels: { enabled: false },
    markers: { size: 0, discrete: discreteMarkers },
    grid: { borderColor: "#e5e7eb", strokeDashArray: 3, xaxis: { lines: { show: false } } },
    xaxis: { categories, labels: { style: { fontSize: "12px" }, rotate: -10 }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: [
      { title: { text: "Score" }, min: 0, max: yLeftMax, decimalsInFloat: 0 },
      { opposite: true, title: { text: "Seconds" }, min: 0, max: yRightMax, decimalsInFloat: 0 },
    ],
    plotOptions: { bar: { borderRadius: 7, columnWidth: "45%" } },
    fill: {
      type: ["solid", "gradient"],
      gradient: { shade: "light", type: "vertical", gradientToColors: ["#60a5fa", "#8b5cf6"], stops: [0, 100], opacityFrom: 0.9, opacityTo: 0.9 },
    },
    tooltip: {
      theme: "dark",
      shared: true,
      custom: ({ dataPointIndex }) => {
        const d = prepared[dataPointIndex];
        if (!d) return "";
        return `
          <div class="px-3 py-2 text-xs">
            <div class="font-semibold mb-1">${d.label}</div>
            <div>Status: ${d.status}</div>
            <div>Score: ${d.score}</div>
            <div>Time: ${d.seconds}s</div>
            <div class="text-[10px] text-gray-300 mt-1">${new Date(d.ts).toLocaleString()}</div>
          </div>`;
      },
    },
    legend: { show: false },
    annotations: {
      yaxis: [
        {
          y: goalScore,
          borderColor: "#16a34a",
          strokeDashArray: 4,
          label: {
            borderColor: "#16a34a",
            style: { color: "#065f46", background: "#a7f3d0", fontSize: "10px", fontWeight: 600 },
            text: `Goal ${goalScore}`,
          },
        },
      ],
    },
  };

  const series = [
    { name: "Score", type: "line", data: scoreData },
    { name: "Time (s)", type: "column", data: timeData },
  ];

  return (
    <div className="border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-[11px] text-gray-400 font-medium mt-0.5">Score = line • Time = bars</div>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-3">
          <span>ASSESSMENT • Recent attempts</span>
          <InlineLegend />
        </div>
      </div>
      <div className="w-full" style={{ height: 320 }}>
        <ReactApexChart options={options} series={series} height={320} />
      </div>
      <div className="text-[11px] text-gray-500 mt-2">Showing up to the last 10 attempts (oldest → newest).</div>
    </div>
  );
}
