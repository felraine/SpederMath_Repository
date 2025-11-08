// src/lessons/lesson3/RewardScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { postOnce } from "../../../utils/requestDedupe";
import { currentStudentId } from "../../../utils/auth";

export default function RewardScreen({ meta }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Keep Lesson 3 behavior: prefer meta, then router state, else fallback to DB id 7
  const lessonId =
    Number(meta?.lessonId) ||
    Number(location.state?.lessonId) ||
    5;

  const startedAtRef = useRef(Date.now());
  const [submitting, setSubmitting] = useState(true);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    // Keep Lesson 3 audio behavior with fallback
    const a = new Audio("/audio/lesson3/reward.mp3");
    a.play().catch(() => new Audio("/audio/reward.mp3").play().catch(() => {}));
  }, []);

  const timeSpent = () =>
    Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));

  // Same local upsert strategy used in both lessons
  const upsertLocalProgress = (id, patch) => {
    let store = {};
    try { store = JSON.parse(localStorage.getItem("lessonProgress") || "{}"); } catch {}
    const prev = store[String(id)] || {};
    store[String(id)] = { ...prev, ...patch, lastSubmitted: Date.now() };
    localStorage.setItem("lessonProgress", JSON.stringify(store));
    return store[String(id)];
  };

  // Keep Lesson 3 submit flow (guarded, uses postOnce key, shows "Saved locally..." on failure)
  const submit = async () => {
    setSubmitting(true);
    setSubmitError("");

    // 1) Always upsert locally first so UI unlocks
    upsertLocalProgress(lessonId, {
      status: "COMPLETED",
      score: 0,
      timeSpentInSeconds: timeSpent(),
    });

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Missing auth token");

      const sid = currentStudentId();
      const key = `submit:${sid}:${lessonId}`;

      await postOnce(key, async () => {
        const res = await fetch("http://localhost:8080/api/student-progress/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            score: 10, // completion score
            status: "COMPLETED",
            timeSpentInSeconds: timeSpent(),
            lessonId,
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

  useEffect(() => { submit(); /* eslint-disable-next-line */ }, []);

  // ===== UI cloned from Lesson 1 (with Lesson 3 text) =====
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

      {/* Text (Lesson 3 wording) */}
      <motion.p
        className="text-lg sm:text-xl mb-4 leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        You learned the numbers <strong>1, 2, 3, 4, 5, 6, and 7</strong>!
      </motion.p>

      {/* Status Message */}
      <div className="text-sm sm:text-base opacity-90 mb-6">
        {submitting && (
          <p className="italic">Saving your progress (lessonId = {lessonId})…</p>
        )}
        {!submitting && !submitError && (
          <p className="text-green-300">Progress saved successfully!</p>
        )}
        {submitError && (
          <p className="text-yellow-300">{submitError}</p>
        )}
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
