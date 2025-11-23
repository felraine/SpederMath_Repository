// src/lessons/lesson1/RewardScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { postOnce } from "../../../utils/requestDedupe";
import { currentStudentId } from "../../../utils/auth";
import { motion } from "framer-motion";
import StarRow from "../../reusable/StarRow";

function BubbleField() {
  const bubbles = React.useMemo(() => {
    const N = 36;
    const rnd = (seed, min, max) => {
      const x = Math.sin(seed * 9301 + 49297) * 233280;
      const u = x - Math.floor(x);
      return min + u * (max - min);
    };
    return Array.from({ length: N }, (_, i) => {
      const left = rnd(i + 1, 0, 100);     
      const top = rnd(i + 2, 0, 100);     
      const size = rnd(i + 3, 8, 26);
      const delay = rnd(i + 4, 0, 6);
      const duration = rnd(i + 5, 6.5, 11);
      const driftX = rnd(i + 6, -40, 40);
      const rise = -rnd(i + 7, 120, 320);  
      return { left, top, size, delay, duration, driftX, rise };
    });
  }, []);

  return (
    <>
      <style>{`
        @keyframes roam {
          0%   { transform: translate(0, 0) scale(0.9); opacity: 0; }
          10%  { opacity: .55; }
          100% { transform: translate(var(--dx), var(--dy)); opacity: 0; }
        }
      `}</style>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {bubbles.map((b, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white/35"
            style={{
              left: `${b.left}%`,
              top: `${b.top}%`,
              width: b.size,
              height: b.size,
              filter: "blur(0.5px)",
              animation: `roam ${b.duration}s linear ${b.delay}s infinite`,
              "--dx": `${b.driftX}px`,
              "--dy": `${b.rise}px`,
            }}
          />
        ))}
      </div>
    </>
  );
}

export default function RewardScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const lessonId = Number(location.state?.lessonId ?? 1);

  const startedAtRef = useRef(Date.now());
  const [submitting, setSubmitting] = useState(true);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    new Audio("/audio/reward.mp3").play().catch(() => {});
  }, []);

  const timeSpent = () =>
    Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));

  const upsertLocalProgress = (lessonId, patch) => {
    let store = {};
    try { store = JSON.parse(localStorage.getItem("lessonProgress") || "{}"); } catch {}
    const prev = store[String(lessonId)] || {};
    store[String(lessonId)] = { ...prev, ...patch, lastSubmitted: Date.now() };
    localStorage.setItem("lessonProgress", JSON.stringify(store));
    return store[String(lessonId)];
  };

  const submitBackend = async (payload) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `reward-${currentStudentId()}-${payload.lessonId}-${Date.now() >> 12}`,
    };

    const key = `submit:${currentStudentId()}:${payload.lessonId}`;
    await postOnce(key, () =>
      axios.post(`${API_BASE}/api/student-progress/submit`, payload, { headers })
    );
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError("");

    // local unlock
    upsertLocalProgress(lessonId, {
      status: "COMPLETED",
      score: 0,
      timeSpentInSeconds: timeSpent(),
    });

    try {
      await submitBackend({
        score: 10,
        status: "COMPLETED",
        timeSpentInSeconds: timeSpent(),
        lessonId,
      });
      setSubmitting(false);
    } catch (e) {
      console.warn("Backend submit failed; using local unlock only.", e?.response?.status, e?.message);
      setSubmitError("Saved locally. Will sync next time.");
      setSubmitting(false);
    }
  };

  useEffect(() => { submit(); /* eslint-disable-line */ }, []);

  return (
    <>
      <BubbleField />

      <div className="relative z-10 px-8 py-12 bg-black/30 backdrop-blur-sm rounded-2xl shadow-lg">
        <motion.h1
          className="text-5xl sm:text-6xl font-extrabold mb-3 drop-shadow-[0_6px_22px_rgba(0,0,0,.45)]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          You did it!
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-4 rounded-2xl px-4 py-2"
          style={{ animation: "glowPulse 2.6s ease-in-out infinite" }}
        >
          <StarRow score={10} />
        </motion.div>

        <motion.p
          className="text-lg sm:text-xl mb-6 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,.35)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          You learned the numbers <strong>1, 2, and 3</strong>!
        </motion.p>

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
              submitting ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
            }`}
            disabled={submitting}
          >
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    </>
  );
}
