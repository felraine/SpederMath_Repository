// src/lessons/lesson1/RewardScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { postOnce } from "../../../utils/requestDedupe";   // ← your util
import { currentStudentId } from "../../../utils/auth";     // ← your util

export default function RewardScreen({ meta }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Prefer meta.lessonId (passed by LessonOne), then router state, then fallback to DB id 7
  const resolvedLessonId =
    Number(meta?.lessonId) ||
    Number(location.state?.lessonId) ||
    7; 

  const startedAtRef = useRef(Date.now());
  const [submitting, setSubmitting] = useState(true);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const a = new Audio("/audio/reward.mp3");
    a.play().catch(() => {});
    return () => {
      try { a.pause(); } catch {}
    };
  }, []);

  const timeSpent = () =>
    Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));

  // local unlock so UX continues even if backend fails
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

  const submit = async () => {
    setSubmitting(true);
    setSubmitError("");

    // Always mark locally
    upsertLocalProgress(resolvedLessonId, {
      status: "COMPLETED",
      score: 0,
      timeSpentInSeconds: timeSpent(),
    });

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Missing auth token");

      const sid = currentStudentId();
      const key = `submit:${sid}:${resolvedLessonId}`;

      await postOnce(key, async () => {
        const res = await fetch("http://localhost:8080/api/student-progress/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            score: 10, // completion score for lesson finish (adjust if needed)
            status: "COMPLETED",
            timeSpentInSeconds: timeSpent(),
            lessonId: resolvedLessonId,
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Submit failed ${res.status}: ${text || res.statusText}`);
        }
      });

      setSubmitting(false);
    } catch (e) {
      console.warn("Reward submit failed (guarded):", e);
      setSubmitError("Saved locally. Will sync next time.");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center text-white mt-12">
      <h1 className="text-4xl font-bold mb-4 drop-shadow">You did it! 🎉</h1>

      <div className="w-36 h-36 bg-yellow-400 rounded-2xl flex items-center justify-center text-6xl mb-4 shadow-xl">
        ⭐
      </div>

      <p className="text-xl mb-2">
        You learned the numbers <strong>1, 2, 3, 4, 5, 6, 7, 8, 9, and 10</strong>!
      </p>

      <div className="text-sm opacity-90 mb-5">
        {submitting && `Saving your progress (lessonId = ${resolvedLessonId})…`}
        {!submitting && !submitError && "Progress saved! ✅"}
        {submitError && <span className="text-yellow-200">{submitError}</span>}
      </div>

      <div className="flex gap-3">
        {submitError && (
          <button
            onClick={submit}
            className="px-4 py-2 rounded-lg bg-amber-500 text-gray-900 font-bold hover:bg-amber-400 transition disabled:opacity-60"
            disabled={submitting}
          >
            Retry Submit
          </button>
        )}
        <button
          onClick={() => navigate("/student-dashboard")}
          className="px-4 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-500 transition disabled:opacity-60"
          disabled={submitting}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
