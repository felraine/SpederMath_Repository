// src/lessons/lesson2/RewardScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { currentStudentId } from "../../../utils/auth";
import { postOnce } from "../../../utils/requestDedupe";

export default function RewardScreen({ meta }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Prefer meta.lessonId, then router state, then fallback to 6 (Lesson 2)
  const resolvedLessonId =
    Number(meta?.lessonId) ||
    Number(location.state?.lessonId) ||
    6;

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
    const sid = currentStudentId();
    const ymd = new Date().toISOString().slice(0, 10);
    return `spm:${sid}:${resolvedLessonId}:${ymd}`;
  };

  const submitBackend = async (payload) => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

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
    if (submittedRef.current) return;
    submittedRef.current = true;

    setSubmitting(true);
    setSubmitError("");

    // Optimistic local save first
    upsertLocalProgress(resolvedLessonId, {
      status: "COMPLETED",
      score: 0,
      timeSpentInSeconds: timeSpent(),
    });

    try {
      await submitBackend({
        lessonId: resolvedLessonId,
        score: 10,
        status: "COMPLETED",
        timeSpentInSeconds: timeSpent(),
        idempotencyKey: makeIdempotencyKey(),
      });
      setSubmitting(false);
    } catch (e) {
      console.warn("Backend submit failed; local unlock only.", e?.message);
      setSubmitError("Saved locally. Will sync next time.");
      setSubmitting(false);
      submittedRef.current = false;
    }
  };

  useEffect(() => {
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center text-white px-4 py-8">
      {/* Title */}
      <motion.h1
        className="text-5xl sm:text-6xl font-extrabold mb-6 drop-shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        You did it!
      </motion.h1>

      {/* Star Trophy */}
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 10 }}
        className="flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40 bg-yellow-400 rounded-3xl shadow-[0_0_30px_rgba(255,215,0,0.7)] mb-6"
      >
        <span className="text-7xl sm:text-8xl">⭐</span>
      </motion.div>

      {/* Text */}
      <motion.p
        className="text-lg sm:text-xl mb-4 leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        You learned the numbers <strong>1, 2, 3, 4, and 5</strong>!
      </motion.p>

      {/* Status */}
      <div className="text-sm sm:text-base opacity-90 mb-6">
        {submitting && (
          <p className="italic">
            Saving your progress (lessonId = {resolvedLessonId})…
          </p>
        )}
        {!submitting && !submitError && (
          <p className="text-green-300">Progress saved successfully!</p>
        )}
        {submitError && <p className="text-yellow-300">{submitError}</p>}
      </div>

      {/* Buttons */}
      <motion.div
        className="flex flex-wrap justify-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {submitError && (
          <button
            onClick={submit}
            className="px-5 py-3 rounded-xl bg-yellow-400 text-[#0b2344] font-bold hover:bg-yellow-500 transition-all shadow-md"
          >
            Retry Submit
          </button>
        )}
        <button
          onClick={() => navigate("/student-dashboard")}
          className={`px-5 py-3 rounded-xl font-bold transition-all shadow-md ${
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
          disabled={submitting}
        >
          Return to Dashboard
        </button>
      </motion.div>
    </div>
  );
}
