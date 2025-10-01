// src/pages/LessonLoader.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import LessonNotFound from "../lessons/LessonNotFound";
import LessonOne from "../lessons/LessonOne/LessonOne";
import AssessmentOne from "../lessons/LessonOne/Assessment/AssessmentOne";
import LessonTwo from "../lessons/LessonTwo/LessonTwo";
import AssessmentTwo from "../lessons/LessonTwo/Assessment/AssessmentTwo";
import LessonThree from "../lessons/LessonThree/LessonThree";
import AssessmentThree from "../lessons/LessonThree/Assessment/AssessmentThree";
import LessonFour from "../lessons/LessonFour/LessonFour";
import AssessmentFour from "../lessons/LessonFour/Assessment/AssessmentFour";

// --- Registry for explicit keys (optional but nice to have)
const ROUTE_REGISTRY = {
  "lesson-one": LessonOne,
  "lesson-two": LessonTwo,
  "lesson-three": LessonThree,
  "lesson-four": LessonFour,
  "assessment-1-3": AssessmentOne,
  "assessment-1-5": AssessmentTwo,
  "assessment-1-7": AssessmentThree,
  "assessment-1-10": AssessmentFour,
};

// --- ABSOLUTE map by DB id (your current data)
const ID_MAP = {
  1: LessonOne,
  2: AssessmentOne,
  3: LessonTwo,       // <-- your Lesson 2 (1–5)
  4: AssessmentTwo,
  5: LessonThree,
  6: AssessmentThree,
  7: LessonFour,
  8: AssessmentFour,
};

// title range detector (fallback)
function detectRangeFromTitle(titleRaw) {
  const title = (titleRaw || "").toLowerCase();
  const m = title.match(/(^|\s)(\d+)\s*(?:-|–|to)\s*(\d+)(\s|$)/i);
  if (m) {
    const a = parseInt(m[2], 10);
    const b = parseInt(m[3], 10);
    if (!Number.isNaN(a) && !Number.isNaN(b)) return [Math.min(a, b), Math.max(a, b)];
  }
  return null;
}

export default function LessonLoader() {
  const { lessonId } = useParams();          // route: /lessons/:lessonId  (this is your DB id)
  const location = useLocation();

  const [meta, setMeta] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setState({ loading: true, error: null });
        const token =
          localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
        const res = await fetch(`http://localhost:8080/api/lessons/${lessonId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (cancelled) return;

        if (res.status === 404) {
          setMeta(null);
          setState({ loading: false, error: null });
          return;
        }
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Failed to load lesson ${lessonId}: ${res.status} ${txt}`);
        }
        const data = await res.json();
        setMeta(data);
        setState({ loading: false, error: null });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e.message || String(e) });
      }
    })();
    return () => { cancelled = true; };
  }, [lessonId]);

  const ResolvedComponent = useMemo(() => {
    // 0) Force via URL query: ?component=lesson-two
    const forcedKey = new URLSearchParams(location.search || "").get("component");
    if (forcedKey && ROUTE_REGISTRY[forcedKey]) {
      console.info(`[LessonLoader] Forced by query: ${forcedKey}`);
      return ROUTE_REGISTRY[forcedKey];
    }

    // 1) Hard map by DB id (most reliable with your current schema)
    const idNum = Number(lessonId);
    if (Number.isFinite(idNum) && ID_MAP[idNum]) {
      console.info(`[LessonLoader] Resolved by ID map: ${idNum} -> ${ID_MAP[idNum].name}`);
      return ID_MAP[idNum];
    }

    // 2) Backend explicit routeKey/componentKey (if you add them later)
    if (meta?.routeKey && ROUTE_REGISTRY[meta.routeKey]) {
      console.info(`[LessonLoader] Resolved by routeKey: ${meta.routeKey}`);
      return ROUTE_REGISTRY[meta.routeKey];
    }
    if (meta?.componentKey && ROUTE_REGISTRY[meta.componentKey]) {
      console.info(`[LessonLoader] Resolved by componentKey: ${meta.componentKey}`);
      return ROUTE_REGISTRY[meta.componentKey];
    }

    // 3) Type + title range fallback
    const title = meta?.title || meta?.name || meta?.description || "";
    const isAssessment =
      /assessment/i.test(title) ||
      String(meta?.type || "").toUpperCase() === "ASSESSMENT";

    const range = detectRangeFromTitle(title);
    if (range) {
      const [, max] = range;
      if (isAssessment) {
        if (max === 3) return AssessmentOne;
        if (max === 5) return AssessmentTwo;
        if (max === 7) return AssessmentThree;
        if (max === 10) return AssessmentFour;
      } else {
        if (max === 3) return LessonOne;
        if (max === 5) return LessonTwo;
        if (max === 7) return LessonThree;
        if (max === 10) return LessonFour;
      }
    }

    return null;
  }, [lessonId, location.search, meta]);

  if (state.loading) {
    return (
      <div className="w-full h-full grid place-items-center p-8">
        <div className="text-center">
          <div className="animate-pulse text-xl font-semibold">Loading lesson…</div>
          <div className="opacity-70 text-sm mt-2">Please wait</div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <LessonNotFound>
        <p className="mt-2 text-sm opacity-80">{state.error}</p>
      </LessonNotFound>
    );
  }

  if (!meta) {
    return (
      <LessonNotFound>
        <p className="mt-2 text-sm opacity-80">Lesson not found.</p>
      </LessonNotFound>
    );
  }

  if (!ResolvedComponent) {
    return (
      <LessonNotFound>
        <p className="mt-2 text-sm opacity-80">
          This lesson isn’t recognized by the current app version.
          Try adding <code>?component=lesson-two</code> to the URL.
        </p>
        <pre className="text-xs bg-black/5 rounded p-2 mt-3 overflow-auto">
{JSON.stringify(
  {
    id: meta?.id,
    title: meta?.title || meta?.name || meta?.description,
    type: meta?.type,
    lessonOrder: meta?.lessonOrder ?? meta?.lessonNumber,
  },
  null,
  2
)}
        </pre>
      </LessonNotFound>
    );
  }

  return <ResolvedComponent /* meta={meta} */ />;
}
