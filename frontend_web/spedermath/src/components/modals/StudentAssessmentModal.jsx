import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { X, Check, Copy, FileDown } from "lucide-react";

/* ================= Spinner ================= */
const Spinner = () => (
  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
);

/* ================= Parsing ================= */
function takeBetweenTags(raw = "") {
  const s = String(raw);
  const m =
    s.match(/<assessment\b[^>]*>([\s\S]*?)<\/assessment\s*>/i) ||
    s.match(/<assessment\b[^>]*>([\s\S]*)$/i);
  return m?.[1]?.trim() || s.trim();
}
function stripTags(t = "") {
  return t.replace(/<[^>]+>/g, "").trim();
}
function splitLines(text = "") {
  return text
    .split(/\n|(?<=[.!?])\s+(?=[A-Z])/)
    .map((l) => stripTags(l.trim()))
    .filter(Boolean);
}
function isValidBullet(s = "") {
  const t = s.trim();
  return t && !/^[.?!]$/.test(t) && t.replace(/[^\w]+/g, "").length > 2;
}

/* ================= HTML Safe Bold Conversion ================= */
function escapeHtml(s = "") {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function convertMarkdownToBoldSafe(text = "") {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*(.*?)\*/g, "<b>$1</b>")
    .replace(/_(.*?)_/g, "<b>$1</b>");
}

/* ================= Prompt ================= */
function buildPromptInsight(perfSummary, fullName) {
  // detect which number ranges exist in the performance summary text
  const ranges = [];
  if (/1[-–]3|NumberMaze/i.test(perfSummary)) ranges.push("1–3");
  if (/1[-–]5|NumberDrop/i.test(perfSummary)) ranges.push("1–5");
  if (/1[-–]7|Feed\s*Munchie/i.test(perfSummary)) ranges.push("1–7");

  const listedRanges =
    ranges.length > 0
      ? `Focus only on these number ranges present in the data: ${ranges.join(", ")}. Do not invent or mention any other ranges.`
      : `If no specific range is found, write a short overall summary only.`;

  return [
    `You are an educational AI generating teacher-style insights for a SPED student's math assessments.`,
    ``,
    `Write exactly 3–5 concise bullet points (each 1–2 sentences max).`,
    `Tone: warm, professional, teacher-observational.`,
    ``,
    `Guidelines:`,
    `• Begin with one overall insight summarizing progress and growth areas.`,
    `• Then write one bullet per available number range based on the data.`,
    `• ${listedRanges}`,
    `• Occasionally mention the student's name ("${fullName}").`,
    `• Focus on interpretation (growth, consistency, pacing, confidence), not on raw statistics.`,
    `• Combine related ideas to avoid redundancy.`,
    `• Keep total length around 90–120 words.`,
    `• Wrap the full response in <assessment>...</assessment>.`,
    ``,
    `STUDENT PERFORMANCE DATA:`,
    perfSummary,
    ``,
    `RESPONSE:`,
    `<assessment>...</assessment>`,
  ].join("\n");
}

/* ================= Sparkle Icon ================= */
const FilledSparkle = ({ size = 16, color = "#FACC15" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={color} viewBox="0 0 24 24" width={size} height={size}>
    <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z" />
    <path d="M6 13l.8 3 3.2.8-3.2.8L6 21l-.8-3.2L2 16.8l3.2-.8L6 13z" />
    <path d="M17 14l.6 2 2.4.6-2.4.6L17 20l-.6-2.4L14 16.6l2.4-.6L17 14z" />
  </svg>
);

/* ================= Ready Animation ================= */
const ReadyAnim = () => (
  <div className="flex flex-col items-center justify-center text-center py-10">
    <div className="relative h-16 w-16 mb-3">
      <svg className="h-16 w-16" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="#10B981"
          strokeWidth="6"
          strokeLinecap="round"
          className="animate-sweep"
          strokeDasharray="176"
          strokeDashoffset="176"
        />
      </svg>
      <svg
        className="absolute inset-0 h-16 w-16"
        viewBox="0 0 64 64"
        fill="none"
        stroke="#10B981"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M18 34 L28 44 L46 24"
          className="animate-check"
          strokeDasharray="50"
          strokeDashoffset="50"
        />
      </svg>
    </div>
    <div className="text-sm font-medium text-emerald-700">Assessment ready</div>
  </div>
);
const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ================= Component ================= */
export default function StudentAssessmentModal({
  open = false,
  onClose = () => {},
  student = null,
  endpoint = `${API_BASE}/api/summarize`,
  useGpt = true,
}) {
  const [phase, setPhase] = useState("idle");
  const [err, setErr] = useState("");
  const [bullets, setBullets] = useState([]);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);

  const fullName = useMemo(() => {
    if (!student) return "";
    const fn = `${student.fname ?? ""} ${student.lname ?? ""}`.trim();
    return fn || (student.username ? `@${student.username}` : "The student");
  }, [student]);

  const getPerfSummary = () =>
    typeof window.spederBuildSummary === "function"
      ? window.spederBuildSummary()
      : "No assessment attempts.";

  async function callSummarizer(promptText) {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      endpoint,
      { text: promptText, useGpt: !!useGpt, maxWords: 900 },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
    return res?.data?.summary ?? res?.data?.text ?? res?.data?.message ?? "";
  }

  /* ================= PDF Export ================= */
  async function exportToPdf() {
    const target = contentRef.current;
    if (!target) return;
    try {
      if (!window.html2canvas) {
        await loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
      }
      if (!window.jspdf?.jsPDF && !window.jsPDF) {
        await loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js");
      }

      const canvas = await window.html2canvas(target, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const JsPDFCtor = window.jspdf?.jsPDF || window.jsPDF;
      const pdf = new JsPDFCtor({ unit: "pt", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const ratio = Math.min(
        (pageW - margin * 2) / canvas.width,
        (pageH - margin * 2) / canvas.height
      );
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      const x = (pageW - imgW) / 2;
      const y = margin;

      pdf.addImage(imgData, "PNG", x, y, imgW, imgH, undefined, "FAST");
      const safeName = fullName.replace(/\s+/g, "_");
      pdf.save(`${safeName}_assessment.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      setErr("PDF export failed. Please try again.");
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
  }

  const runAI = async () => {
    if (!student) return;
    setPhase("loading");
    setErr("");
    setBullets([]);

    const perfSummary = getPerfSummary();
    try {
      const raw = await callSummarizer(buildPromptInsight(perfSummary, fullName));
      const extracted = convertMarkdownToBoldSafe(takeBetweenTags(raw));

      const lines = splitLines(extracted)
        .map((l) => l.replace(/^[-•\d.)\s]+/, "").trim())
        .filter(isValidBullet);

      if (!lines.length) throw new Error("Empty result");

      setBullets(lines);
      setPhase("anim");
      setTimeout(() => setPhase("ready"), 800);
    } catch (e) {
      console.error(e);
      setErr("AI could not generate interpretive insights. Try again later.");
      setPhase("ready");
    }
  };

  useEffect(() => {
    if (open && student) runAI();
    else {
      setPhase("idle");
      setBullets([]);
      setErr("");
    }
  }, [open, student?.id]); // eslint-disable-line

  const copyOut = async () => {
    const lines = [`AI Assessment — ${fullName}`, "", ...bullets.map((b) => `• ${b}`)];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  if (!open || !student) return null;

  return (
    <div className="fixed inset-0 z-[10060]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-3" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-scaleIn">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b bg-white/80">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <FilledSparkle />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">AI Assessment</div>
                <h3 className="font-bold text-base sm:text-lg text-gray-900">{fullName}</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 active:scale-95">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            {phase === "loading" && (
              <div className="flex flex-col items-center justify-center py-12">
                <Spinner />
                <div className="mt-3 text-gray-700 font-medium">Generating concise insights…</div>
                <div className="text-xs text-gray-500 mt-1">
                  Summarizing number-range performance with merged details.
                </div>
              </div>
            )}
            {phase === "anim" && <ReadyAnim />}
            {phase === "ready" && (
              <div className="space-y-4">
                {err && (
                  <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {err}
                  </div>
                )}

                {!!bullets.length && (
                  <div
                    ref={contentRef}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm h-[60vh] sm:h-[64vh] overflow-y-auto scrollbar-hide"
                  >
                    <div className="font-semibold text-[15px] text-gray-900 mb-2">Key Insights</div>
                    <ul className="list-disc pl-5 space-y-2 text-[15px] leading-7 text-gray-800">
                      {bullets.map((b, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: b }} />
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <div>Tip: Copy or export this card to PDF.</div>
                  <div className="flex gap-2">
                    <button
                      onClick={exportToPdf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 active:scale-95"
                      disabled={!bullets.length}
                    >
                      <FileDown className="w-4 h-4" />
                      Export PDF
                    </button>

                    <button
                      onClick={copyOut}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 active:scale-95"
                      disabled={!bullets.length}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes scaleIn {
            from { opacity:0; transform:translateY(4px) scale(.98); }
            to { opacity:1; transform:translateY(0) scale(1); }
          }
          .animate-scaleIn{animation:scaleIn .22s ease-out;}
          @keyframes sweep{from{stroke-dashoffset:176;}to{stroke-dashoffset:0;}}
          @keyframes drawCheck{from{stroke-dashoffset:50;}to{stroke-dashoffset:0;}}
          .animate-sweep{animation:sweep .8s ease-out forwards;}
          .animate-check{animation:drawCheck .5s ease-out .3s forwards;}
          .scrollbar-hide::-webkit-scrollbar{display:none;}
        `}</style>
      </div>
    </div>
  );
}
