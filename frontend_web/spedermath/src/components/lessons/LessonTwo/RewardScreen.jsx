// src/lessons/lesson2/RewardScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { currentStudentId } from "../../../utils/auth";
import { postOnce } from "../../../utils/requestDedupe";

export default function RewardScreen({ meta }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Prefer meta.lessonId, then router state, then fallback to 3 (Lesson 1–5)
  const resolvedLessonId =
    Number(meta?.lessonId) ||
    Number(location.state?.lessonId) ||
    3;

  const startedAtRef = useRef(Date.now());
  const submittedRef = useRef(false);

  const [submitting, setSubmitting] = useState(true);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    new Audio("/audio/reward.mp3").play().catch(() => {});
  }, []);

  const timeSpent = () =>
    Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));

  const upsertLocalProgress = (lessonId, patch) => {
    let store = {};
    try {
      store = JSON.parse(localStorage.getItem("lessonProgress") || "{}");
    } catch {}
    const prev = store[String(lessonId)] || {};
    store[String(lessonId)] = { ...prev, ...patch, lastSubmitted: Date.now() };
    localStorage.setItem("lessonProgress", JSON.stringify(store));
    return store[String(lessonId)];
  };

  const makeIdempotencyKey = () => {
    const sid = currentStudentId(); // from utils/auth
    const ymd = new Date().toISOString().slice(0, 10);
    return `spm:${sid}:${resolvedLessonId}:${ymd}`;
  };

  const submitBackend = async (payload) => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // postOnce dedupes identical, rapid calls
    return postOnce(`submit:${payload.idempotencyKey}`, () =>
      fetch("http://localhost:8080/api/student-progress/submit", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res;
      })
    );
  };

  const submit = async () => {
    if (submittedRef.current) return; // hard guard
    submittedRef.current = true;

    setSubmitting(true);
    setSubmitError("");

    // Optimistic local unlock
    upsertLocalProgress(resolvedLessonId, {
      status: "COMPLETED",
      score: 0,
      timeSpentInSeconds: timeSpent(),
    });

    try {
      await submitBackend({
        lessonId: resolvedLessonId,
        score: 10, // completion score for lesson
        status: "COMPLETED",
        timeSpentInSeconds: timeSpent(),
        idempotencyKey: makeIdempotencyKey(),
      });
      setSubmitting(false);
    } catch (e) {
      console.warn("Backend submit failed; local unlock only.", e?.message);
      setSubmitError("Saved locally. Will sync next time.");
      setSubmitting(false);
      submittedRef.current = false; // allow Retry
    }
  };

  useEffect(() => {
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-12 text-white">
      <h1 className="text-4xl font-extrabold">You did it! 🎉</h1>

      <div className="w-[150px] h-[150px] bg-yellow-400 mt-3 rounded-2xl flex items-center justify-center text-6xl shadow-lg">
        ⭐
      </div>

      <p className="text-lg mt-2">
        You learned the numbers <strong>1, 2, 3, 4, and 5</strong>!
      </p>

      <div className="mt-2 text-sm opacity-95">
        {submitting && `Saving your progress (lessonId = ${resolvedLessonId})…`}
        {!submitting && !submitError && "Progress saved! ✅"}
        {submitError && <span className="text-yellow-200">{submitError}</span>}
      </div>

      <div className="mt-4 flex gap-2">
        {submitError && (
          <button
            onClick={submit}
            className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-bold shadow"
          >
            Retry Submit
          </button>
        )}
        <button
          onClick={() => navigate("/student-dashboard")}
          className="px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow disabled:opacity-60"
          disabled={submitting}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
