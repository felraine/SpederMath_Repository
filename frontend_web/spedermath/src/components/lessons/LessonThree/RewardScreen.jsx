// src/lessons/lesson3/RewardScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function RewardScreen({ meta }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Prefer meta.lessonId (passed by LessonThree), then router state, then fallback to 7
  const resolvedLessonId =
    Number(meta?.lessonId) ||
    Number(location.state?.lessonId) ||
    7; // DB id for "Learn how to count from 1-7"

  const startedAtRef = useRef(Date.now());
  const [submitting, setSubmitting] = useState(true);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    // play lesson 3 reward if present, else fallback to your previous reward
    const a = new Audio("/audio/lesson3/reward.mp3");
    a.play().catch(() => {
      new Audio("/audio/reward.mp3").play().catch(() => {});
    });
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
    return axios.post(
      "http://localhost:8080/api/student-progress/submit",
      payload,
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError("");

    // Local upsert so unlocks proceed even if backend fails
    upsertLocalProgress(resolvedLessonId, {
      status: "COMPLETED",
      score: 0,
      timeSpentInSeconds: timeSpent(),
    });

    try {
      await submitBackend({
        score: 10, // or whatever you record for a lesson completion
        status: "COMPLETED",
        timeSpentInSeconds: timeSpent(),
        lessonId: resolvedLessonId,
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

      <div
        style={{
          width: 150, height: 150, backgroundColor: "#FFD700", margin: "12px auto",
          borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60
        }}
      >
        ⭐
      </div>

      <p style={{ fontSize: 20 }}>
        You learned the numbers{" "}
        <strong>1, 2, 3, 4, 5, 6, and 7</strong>!
      </p>

      <div style={{ marginTop: 10, fontSize: 14, opacity: 0.95 }}>
        {submitting && `Saving your progress (lessonId = ${resolvedLessonId})…`}
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
