import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { X, Check, Copy } from "lucide-react";

const Spinner = () => (
  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
);

/* ===================== Parsing & Cleaners ===================== */

function takeBetweenTags(raw = "") {
  const m =
    String(raw).match(/<assessment[^>]*>([\s\S]*?)<\/assessment>/i) ||
    String(raw).match(/<assessment[^>]*>([\s\S]*)$/i);
  return m?.[1]?.trim() || "";
}
function looksLikeParagraph(s = "") {
  const t = s.trim();
  if (!t) return false;
  const banned = /(DATA|INSTRUCTION|Using the DATA|Output ONLY|RESPONSE FORMAT|Task:|Instruction:)/i;
  if (banned.test(t)) return false;
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.length >= 2 && sentences.length <= 9 && t.length >= 80;
}
function cleanParagraph(text = "") {
  let out = text.replace(/\s+/g, " ").trim();
  out = out
    .replace(/^task:.*?$/gim, "")
    .replace(/^instructions?:.*?$/gim, "")
    .replace(/^data:.*?$/gim, "")
    .replace(/^(role|response format).*?$/gim, "")
    .trim();
  if (!/[.!?]$/.test(out)) out += ".";
  return out;
}

/* ===================== Prompts (SPED-aware) ===================== */

function buildPromptPrimary(perfSummary, fullName) {
  return [
    `You are an educational analyst writing a teacher-facing progress note for a learner in a SPED (special education) context.`,
    ``,
    `Write as if this will appear in a professional report to teachers/parents. Use strengths-based, respectful language and avoid deficit framing.`,
    `Consider common SPED supports (e.g., visual cues, chunking, repetition, errorless learning, gradual release, AAC, sensory breaks, predictable routines).`,
    ``,
    `Rules:`,
    `• Output exactly one insightful paragraph (6–8 sentences, ~130–180 words).`,
    `• Third person, professional teacher tone.`,
    `• **Begin the paragraph with the student's full name: "${fullName}".**`,
    `• Summarize overall trajectory first, then identify strengths and needs by full assessment titles (e.g., “Assessment (1–3): NumberMaze”).`,
    `• If "maxScore" is present and > 0, you may reference it; NEVER write "(max 0)". If missing, say “near the maximum” instead of a number.`,
    `• Provide concrete, SPED-informed next steps (scaffolding, pacing, visuals, practice dosage, mastery criteria).`,
    `Wrap only the final paragraph in <assessment>...</assessment>.`,
    ``,
    `STUDENT ASSESSMENT DATA:`,
    perfSummary,
    ``,
    `RESPONSE:`,
    `<assessment>...</assessment>`,
  ].join("\n");
}

function buildPromptFewShot(perfSummary, fullName) {
  return [
    `You generate concise, SPED-aware assessment summaries for a math learning app.`,
    `Write ONE paragraph (6–8 sentences, ~130–180 words) in third person and wrap it in <assessment>...</assessment>.`,
    `**Start with the student's full name: "${fullName}".**`,
    `Include: overall progress; strengths and needs by assessment title; interpretation using maxScore if > 0 (never "(max 0)"), or qualitative phrasing if absent; practical SPED-aligned next steps (e.g., chunking tasks, visual prompts, short high-success trials, timed practice only after accuracy stabilizes).`,
    ``,
    `STUDENT ASSESSMENT DATA:`,
    perfSummary,
    ``,
    `OUTPUT:`,
    `<assessment>...</assessment>`,
  ].join("\n");
}

/* ===================== Filled Sparkle Icon ===================== */

const FilledSparkle = ({ size = 16, color = "#FACC15", className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill={color}
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
  >
    <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z" />
    <path d="M6 13l.8 3 3.2.8-3.2.8L6 21l-.8-3.2L2 16.8l3.2-.8L6 13z" />
    <path d="M17 14l.6 2 2.4.6-2.4.6L17 20l-.6-2.4L14 16.6l2.4-.6L17 14z" />
  </svg>
);

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
      { text: promptText, useGpt: !!useGpt, maxWords: 250 },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
    return res?.data?.summary ?? res?.data?.text ?? res?.data?.message ?? "";
  }

  const runAI = async () => {
    if (!student) return;
    setPhase("loading");
    setErr("");
    setText("");

    const perfSummary = getPerfSummary();

    try {
      const raw1 = await callSummarizer(buildPromptPrimary(perfSummary, fullName));
      let extracted = takeBetweenTags(raw1);

      if (!extracted || !looksLikeParagraph(extracted)) {
        const raw2 = await callSummarizer(buildPromptFewShot(perfSummary, fullName));
        extracted = takeBetweenTags(raw2);
      }

      if (extracted && looksLikeParagraph(extracted)) {
        const safe = extracted.replace(/\(max\s*0\)/gi, "(near the maximum)");
        setText(cleanParagraph(safe));
        setPhase("ready");
        return;
      }

      setErr("AI did not return a valid assessment. Please try again later.");
      setPhase("ready");
    } catch (e) {
      console.error("[AI assessment] error:", e);
      setErr(
        e?.response?.data?.message ||
          "AI service error — unable to generate an assessment right now."
      );
      setPhase("ready");
    }
  };

  useEffect(() => {
    if (open && student) runAI();
    else {
      setPhase("idle");
      setText("");
      setErr("");
    }
  }, [open, student?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
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
          {/* Header with circular filled sparkle */}
          <div className="flex items-center justify-between px-5 py-3 border-b bg-white/80">
            <div className="min-w-0 flex items-center gap-2">
              <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-600">
                <FilledSparkle size={16} color="#FACC15" />
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  AI Assessment
                </div>
                <h3 className="font-bold text-base sm:text-lg truncate text-gray-900">
                  {fullName}
                </h3>
              </div>
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
                <div className="mt-3 font-medium text-gray-900 text-[15px]">
                  Generating assessment…
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Analyzing recent assessment attempts and scores.
                </div>
              </div>
            )}

            {phase === "ready" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Assessment ready</span>
                </div>

                {err && (
                  <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {err}
                  </div>
                )}

                {text && (
                  <div className="text-[15px] leading-7 text-gray-900 bg-white border border-gray-200 rounded-xl p-4 shadow-sm whitespace-pre-wrap">
                    {text}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-gray-500">
                    Tip: Copy and paste into your progress notes.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyOut}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 active:scale-95 transition"
                      disabled={!text}
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
