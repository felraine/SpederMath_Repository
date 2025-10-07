// src/lessons/lesson1/RewardScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { postOnce } from "../../../utils/requestDedupe";
import { currentStudentId } from "../../../utils/auth";

export default function RewardScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  // IMPORTANT: use the real DB id for this lesson (you said Lesson 1 is id=5)
  const lessonId = Number(location.state?.lessonId ?? 1);

  const startedAtRef = useRef(Date.now());
  const [submitting, setSubmitting] = useState(true);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    new Audio("/audio/reward.mp3").play().catch(() => {});
  }, []);

  const timeSpent = () =>
    Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));

  /** ---- Frontend "upsert" into localStorage ----
   * Key: lessonProgress
   * Shape:
   * {
   *   "5": { status: "COMPLETED", score: 0, timeSpentInSeconds: 42, lastSubmitted: 169... },
   *   "6": { ... }
   * }
   */
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
      axios.post("http://localhost:8080/api/student-progress/submit", payload, { headers })
    );
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError("");

    // 1) Always upsert locally first so UI unlocks
    upsertLocalProgress(lessonId, {
      status: "COMPLETED",
      score: 0,
      timeSpentInSeconds: timeSpent(),
    });

    // 2) Best-effort backend submit (non-blocking for unlocks)
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

  useEffect(() => { submit(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="screen" style={{ textAlign: "center", marginTop: 50, color: "#fff" }}>
      <h1 className="text-4xl font-bold">You did it! 🎉</h1>

      <div style={{
        width: 150, height: 150, backgroundColor: "#FFD700", margin: "12px auto",
        borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60
      }}>⭐</div>

      <p style={{ fontSize: 20 }}>You learned the numbers <strong>1, 2, and 3</strong>!</p>

      <div style={{ marginTop: 10, fontSize: 14, opacity: 0.95 }}>
        {submitting && `Saving your progress (lessonId = ${lessonId})…`}
        {!submitting && !submitError && "Progress saved! ✅"}
        {submitError && <span style={{ color: "#fde68a" }}>{submitError}</span>}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
        {submitError && (
          <button
            onClick={submit}
            className="px-4 py-2 rounded-lg"
            style={{ background: "#f59e0b", color: "#0b2344", fontWeight: 700 }}
          >
            Retry Submit
          </button>
        )}
        <button
          onClick={() => navigate("/student-dashboard")}
          className="px-4 py-2 rounded-lg"
          style={{ background: "#16a34a", color: "#fff", fontWeight: 700 }}
          disabled={submitting}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
