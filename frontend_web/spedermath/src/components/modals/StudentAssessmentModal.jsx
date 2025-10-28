import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { X, RefreshCw, Check, Copy } from "lucide-react";

const Spinner = () => (
  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
);

/* ===================== Parsing & Basic Cleaners ===================== */

function takeBetweenTags(raw = "") {
  const m = String(raw).match(/<assessment[^>]*>([\s\S]*?)<\/assessment>/i);
  return m?.[1]?.trim() || "";
}
function looksLikeParagraph(s = "") {
  const t = s.trim();
  if (!t) return false;
  const banned =
    /(DATA|INSTRUCTION|Using the DATA|Output ONLY|RESPONSE FORMAT|Task:|Instruction:)/i;
  if (banned.test(t)) return false;
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.length >= 2 && sentences.length <= 7 && t.length >= 80;
}
function cleanParagraph(text = "") {
  let out = text.replace(/\s+/g, " ").trim();
  out = out
    .replace(/^task:.*?$/gi, "")
    .replace(/^instructions?:.*?$/gi, "")
    .replace(/^data:.*?$/gi, "")
    .replace(/^(role|response format).*?$/gi, "")
    .trim();
  if (!/[.!?]$/.test(out)) out += ".";
  return out;
}

/* ===================== Small Utils ===================== */

function listify(arr) {
  if (!arr.length) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")}, and ${arr.at(-1)}`;
}
function uniqueStrings(arr) {
  const s = new Set();
  return arr.filter((x) => (x && !s.has(x) && s.add(x), x));
}

/* ===================== Parse perf summary into objects ===================== */
/** Accept either "Lesson 1 "..." : ..." or "Assessment 1 "..." : ..." */
function parseAssessments(perfSummary = "") {
  const out = [];
  for (const rawChunk of perfSummary.split("|")) {
    const chunk = rawChunk.trim();
    const m = chunk.match(/\b(?:Lesson|Assessment)\s+(\d+)\s+"([^"]+)"\s*:\s*(.*)$/i);
    if (!m) continue;
    const [, idxStr, title, rest] = m;
    const getNum = (rx) => Number((rest.match(rx) || [])[1] || 0);
    const attempts = getNum(/attempts=(\d+)/i);
    const last = getNum(/last=(\d+)/i);
    const best = getNum(/best=(\d+)/i);
    const avgScore = getNum(/avgScore=(\d+)/i);
    const avgTime = getNum(/avgTimeSec=(\d+)/i);
    const maxScore = getNum(/maxScore=(\d+)/i);
    const trend = ((rest.match(/trend=([a-z\-]+)/i) || [])[1] || "flat").toLowerCase();
    out.push({
      idx: Number(idxStr),
      title,
      attempts,
      last,
      best,
      avgScore,
      avgTime,
      maxScore,
      trend,
    });
  }
  return out;
}

/* ===================== Dynamic heuristic (no hardcoding) ===================== */
/** Simpler heuristic if AI call fails */
function heuristicAssessment(perfSummary = "", studentName = "The student") {
  const assessments = parseAssessments(perfSummary);
  if (!assessments.length) {
    return `${studentName} has limited assessment activity so far. Begin with the first assessment (1–3) and guide short review sessions to improve accuracy.`;
  }

  const weak = assessments
    .filter((a) => a.last <= a.maxScore * 0.7 || a.trend === "down" || a.avgTime >= 60)
    .sort((a, b) => (a.last - b.last) || (b.avgTime - a.avgTime));
  const strong = assessments.filter(
    (a) => a.last >= a.maxScore * 0.9 || a.best >= a.maxScore
  );

  let opener = "";
  if (weak.length && !strong.length)
    opener = `${studentName} is still developing confidence on the early assessments.`;
  else if (weak.length && strong.length)
    opener = `${studentName} shows progress in some assessments but still needs practice in key areas.`;
  else opener = `${studentName} is performing consistently across recent assessments.`;

  const focus = (weak.length ? weak : assessments).slice(0, 3);
  const focusText = focus.map(a => `${a.title} (max ${a.maxScore})`).join(", ");

  const closer = `Focus next on ${focusText}, helping the student gradually approach each assessment’s full score and maintain that performance for at least two rounds.`;

  return cleanParagraph(`${opener} ${closer}`);
}

/* ===================== Teacher-Friendly Prompts (AI-driven) ===================== */

    function buildPromptPrimary(perfSummary, name) {
    return [
        `You are an educational analyst helping a teacher prepare a detailed progress note about a student's math learning performance.`,
        ``,
        `Write the comment as if the teacher is recording observations for a report or professional log — NOT speaking to the student directly.`,
        `The note should discuss the student's progress, observed patterns, and instructional recommendations.`,
        ``,
        `Rules:`,
        `• Write one insightful paragraph (6–8 sentences, around 130–180 words).`,
        `• Use a professional teacher tone, in third person (e.g., “Felraine shows progress…” or “The student demonstrates…”).`,
        `• Do NOT use “you” or “your.” The audience is another teacher, not the student.`,
        `• Summarize overall progress first, then highlight assessments showing strengths and weaknesses.`,
        `• Mention assessments by their full titles (e.g., “Assessment (1–3): NumberMaze”).`,
        `• Refer to "maxScore" to identify mastery thresholds (e.g., consistent scores near the maximum).`,
        `• Conclude with evidence-based teaching recommendations or next steps (e.g., repetition, pacing, scaffolding).`,
        `Wrap only the final paragraph in <assessment>...</assessment>.`,
        ``,
        `STUDENT ASSESSMENT DATA:`,
        perfSummary,
        ``,
        `RESPONSE:`,
        `<assessment>...</assessment>`,
    ].join("\n");
    }

    function buildPromptFewShot(perfSummary, name) {
    return [
        `You are generating teacher-facing assessment summaries describing a student's performance trends in a math learning application.`,
        ``,
        `Each summary should sound like it belongs in a progress report — analytical, professional, and written in third person.`,
        `Avoid addressing the student directly; write as though another educator or parent will read this.`,
        `Each output is one paragraph (6–8 sentences, roughly 130–180 words) wrapped in <assessment>...</assessment>.`,
        ``,
        `The paragraph must include:`,
        `• Overview of the student’s current performance and improvement pattern.`,
        `• Identification of strong and weak assessment areas by name.`,
        `• Interpretation of the data using maxScore to define mastery or gaps.`,
        `• Practical next steps for teaching or reinforcement strategies.`,
        ``,
        `STUDENT ASSESSMENT DATA:`,
        perfSummary,
        ``,
        `OUTPUT:`,
        `<assessment>...</assessment>`,
    ].join("\n");
    }

/* ===================== Component ===================== */

export default function StudentAssessmentModal({
  open = false,
  onClose = () => {},
  student = null,
  endpoint = "http://localhost:8080/api/summarize",
  useGpt = true,
}) {
  const [phase, setPhase] = useState("idle");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const closeBtnRef = useRef(null);

  const fullName = useMemo(() => {
    if (!student) return "";
    const fn = `${student.fname ?? ""} ${student.lname ?? ""}`.trim();
    return fn || (student.username ? `@${student.username}` : "Student");
  }, [student]);

  const getPerfSummary = () =>
    typeof window.spederBuildSummary === "function"
      ? window.spederBuildSummary()
      : "No assessment attempts.";

  async function callSummarizer(promptText) {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      endpoint,
      { text: promptText, useGpt: true, maxWords: 250 },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
    return res?.data?.summary ?? res?.data?.text ?? res?.data?.message ?? "";
  }

  const callAI = async () => {
    if (!student) return;
    setPhase("loading");
    setErr("");
    setText("");

    const perfSummary = getPerfSummary();
    const name = fullName || "the student";

    try {
      const raw1 = await callSummarizer(buildPromptPrimary(perfSummary, name));
      let extracted = takeBetweenTags(raw1);

      if (!extracted || !looksLikeParagraph(extracted)) {
        const raw2 = await callSummarizer(buildPromptFewShot(perfSummary, name));
        extracted = takeBetweenTags(raw2);
      }

      if (extracted && looksLikeParagraph(extracted)) {
        setText(cleanParagraph(extracted));
        setPhase("ready");
        return;
      }

      const local = heuristicAssessment(perfSummary, fullName || "The student");
      setText(local);
      setPhase("ready");
    } catch (e) {
      console.error("[AI assessment] error:", e);
      const local = heuristicAssessment(perfSummary, fullName || "The student");
      setText(local);
      setErr(
        e?.response?.data?.message ||
          "AI service error — showing an auto-generated assessment instead."
      );
      setPhase("ready");
    }
  };

  useEffect(() => {
    if (open && student) {
      callAI();
    } else {
      setPhase("idle");
      setText("");
      setErr("");
    }
  }, [open, student?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const copyOut = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  if (!open || !student) return null;

  return (
    <div className="fixed inset-0 z-[10060]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 flex items-center justify-center p-3"
        role="dialog"
        aria-modal="true"
        aria-label="AI Assessment"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-scaleIn">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                AI Assessment
              </div>
              <h3 className="font-bold text-lg truncate">{fullName}</h3>
            </div>
            <button
              ref={closeBtnRef}
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5">
            {phase === "loading" && (
              <div className="flex flex-col items-center justify-center text-center py-14">
                <Spinner />
                <div className="mt-3 font-medium text-gray-800">
                  Generating assessment…
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Analyzing recent assessment attempts and scores.
                </div>
              </div>
            )}

            {phase === "ready" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Assessment ready</span>
                </div>

                {err && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {err}
                  </div>
                )}

                <div className="text-sm leading-relaxed text-gray-800 bg-gray-50/70 border border-gray-200 rounded-xl p-4 whitespace-pre-line">
                  {text}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-gray-500">
                    Tip: Click “Regenerate” to refresh after new attempts.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyOut}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 active:scale-95 transition"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={callAI}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <style>
          {`
            @keyframes scaleIn {
              from { opacity: 0; transform: translateY(4px) scale(.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-scaleIn { animation: scaleIn .22s ease-out; }
          `}
        </style>
      </div>
    </div>
  );
}
