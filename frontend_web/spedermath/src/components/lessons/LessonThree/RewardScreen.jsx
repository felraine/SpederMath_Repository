// src/lessons/lesson3/RewardScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { currentStudentId } from "../../../utils/auth";
import { postOnce } from "../../../utils/requestDedupe";
import StarRow from "../../reusable/StarRow";
import FallingLeaves from "../../ui/FallingLeaves";

export default function RewardScreen({ meta }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Prefer meta.lessonId, then router state, then fallback to 5 (Lesson 3)
  const resolvedLessonId =
    Number(meta?.lessonId) || Number(location.state?.lessonId) || 5;

  const startedAtRef = useRef(Date.now());
  const submittedRef = useRef(false);
  const [submitting, setSubmitting] = useState(true);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    // Prefer L3 reward audio, fallback to generic
    const a = new Audio("/audio/lesson3/reward.mp3");
    a.play().catch(() => new Audio("/audio/reward.mp3").play().catch(() => {}));
  }, []);

  const timeSpent = () =>
    Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));

  // Local optimistic upsert
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
      submittedRef.current = false; // allow retry
    }
  };

  useEffect(() => {
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-center text-white overflow-hidden">
      {/* Background shooting stars */}
      <div className="fixed inset-0 -z-10">
        <FallingLeaves count={24} />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 px-4 py-8 bg-black/30 backdrop-blur-sm rounded-2xl shadow-lg">
        {/* Title */}
        <motion.h1
          className="text-5xl sm:text-6xl font-extrabold mb-6 drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          You did it!
        </motion.h1>

        {/* StarRow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-4 rounded-2xl px-4 py-2"
          style={{ animation: "glowPulse 2.6s ease-in-out infinite" }}
        >
          <StarRow score={10} />
        </motion.div>

        {/* Lesson 3 text */}
        <motion.p
          className="text-lg sm:text-xl mb-4 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          You learned the numbers <strong>1, 2, 3, 4, 5, 6, and 7</strong>!
        </motion.p>

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
    </div>
  );
}
