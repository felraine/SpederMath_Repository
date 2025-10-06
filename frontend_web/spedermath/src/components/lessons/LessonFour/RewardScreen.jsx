// src/lessons/lesson1/RewardScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function RewardScreen({ meta }) {
  const navigate = useNavigate();
  const location = useLocation();

  const resolvedLessonId =
    Number(meta?.lessonId) ||
    Number(location.state?.lessonId) ||
    3;

  const startedAtRef = useRef(Date.now());
  const calledOnceRef = useRef(false);
  const abortRef = useRef(null);

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
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    return axios.post(
      "http://localhost:8080/api/student-progress/submit",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: abortRef.current.signal,
      }
    );
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError("");

    upsertLocalProgress(resolvedLessonId, {
      status: "COMPLETED",
      score: 0,
      timeSpentInSeconds: timeSpent(),
    });

    try {
      await submitBackend({
        score: 10,
        status: "COMPLETED",
        timeSpentInSeconds: timeSpent(),
        lessonId: resolvedLessonId,
      });
      setSubmitting(false);
    } catch (e) {
      if (axios.isCancel(e)) return;
      setSubmitError("Saved locally. Will sync next time.");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (calledOnceRef.current) return;
    calledOnceRef.current = true;
    submit();
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen" style={{ textAlign: "center", marginTop: 50, color: "#fff" }}>
      <h1 className="text-4xl font-bold">You did it! 🎉</h1>

      <div
        style={{
          width: 150,
          height: 150,
          backgroundColor: "#FFD700",
          margin: "12px auto",
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 60,
        }}
      >
        ⭐
      </div>

      <p style={{ fontSize: 20 }}>
        You learned the numbers <strong>1, 2, 3, 4, and 5</strong>!
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
            disabled={submitting}
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
