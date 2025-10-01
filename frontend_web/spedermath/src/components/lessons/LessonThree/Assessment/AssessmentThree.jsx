import React from "react";
// If your file is still at components/lessons/FeedMunchie.jsx:
import FeedMunchie from "./FeedMunchie";

// If you later move it beside this file, change to:
// import FeedMunchie from "./FeedMunchie";
export default function AssessmentThree() {
  // Use your real DB lessonId for Lesson 3 assessment.
  // If you used: 1–3 -> id for AssessmentOne, 1–5 -> AssessmentTwo,
  // pick the next id for 1–7 (example: 6). Update to your actual ID.
  const LESSON3_ASSESSMENT_ID = 6;

  return (
    <FeedMunchie
      // If your component needs any props, pass them here.
      // Make sure inside FeedMunchie you POST with this lessonId.
      lessonId={LESSON3_ASSESSMENT_ID}
      title="Lesson 3 Assessment: Feed Munchie (1–7)"
    />
  );
}
