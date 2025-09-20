// src/pages/LessonLoader.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import LessonNotFound from "../lessons/LessonNotFound";
import LessonOne from "../lessons/LessonOne/index";
import AssessmentOne from "../lessons/LessonOne/Assessment/index";
// import more screens here as you build them…

// ---- OPTIONAL: when you add routeKey/componentKey from backend, map them here
const ROUTE_REGISTRY = {
  // routeKey or componentKey → Component
  "lesson-one": LessonOne,
  "assessment-1-3": AssessmentOne,
};

// Fallback inference if your backend doesn't yet provide routeKey/componentKey
function resolveComponentFromMeta(meta) {
  // Prefer backend-provided keys if present
  if (meta?.routeKey && ROUTE_REGISTRY[meta.routeKey]) return ROUTE_REGISTRY[meta.routeKey];
  if (meta?.componentKey && ROUTE_REGISTRY[meta.componentKey]) return ROUTE_REGISTRY[meta.componentKey];

  // Heuristics until you add keys in DB:
  // Example: if it's clearly an “Assessment of Numbers 1-3”
  if (/assessment/i.test(meta?.title || "") && /1-3|1\s*to\s*3|one.*three/i.test(meta?.title || "")) {
    return AssessmentOne;
  }

  // Example: your first counting lesson
  if (Number(meta?.lessonOrder) === 1) return LessonOne;

  // Add more inference rules as you add lessons:
  // if (meta?.type === "COUNTING" && Number(meta?.lessonOrder) === 2) return SomeOtherLesson;

  return null; // Not recognized → show not found
}

const LessonLoader = () => {
  const { lessonId } = useParams(); // matches your route: /lessons/:lessonId
  const [meta, setMeta] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");

    async function fetchLesson() {
      setState({ loading: true, error: null });
      try {
        const res = await fetch(`http://localhost:8080/api/lessons/${lessonId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.status === 404) {
          if (!cancelled) { setMeta(null); setState({ loading: false, error: null }); }
          return;
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Failed to load lesson ${lessonId}: ${res.status} ${txt}`);
        }

        const data = await res.json();
        if (!cancelled) { setMeta(data); setState({ loading: false, error: null }); }
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e.message || String(e) });
      }
    }

    fetchLesson();
    return () => { cancelled = true; };
  }, [lessonId]);

  const ResolvedComponent = useMemo(() => {
    if (!meta) return null;
    return resolveComponentFromMeta(meta);
  }, [meta]);

  if (state.loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-gray-700">
        Loading lesson…
      </div>
    );
  }

  if (state.error) {
    return (
      <LessonNotFound>
        <p className="mt-2 text-sm opacity-80">Error: {state.error}</p>
      </LessonNotFound>
    );
  }

  if (!ResolvedComponent) {
    // Not recognized by the current registry/heuristics
    return <LessonNotFound />;
  }

  // Render the resolved screen
  return <ResolvedComponent />;
};

export default LessonLoader;
