import React, { useState } from "react";
import LessonLayout from "../../../reusable/LessonLayout";
import AssessmentMain from "./AssessmentMain";

const index = () => {
  const [step, setStep] = useState(1);
  const [finalScore, setFinalScore] = useState(null);

  const nextStep = () => setStep((prev) => prev + 1);

  const handleFinish = (score) => {
    setFinalScore(score);
    nextStep(); // go to reward screen
  };

  const progress = step === 1 ? "1/10" : "Completed";

  return (
    <LessonLayout lesson={{ lessonid: "1-3", title: "Lesson 1-3 Assessment" }} progress={progress}>
      {step === 1 && <AssessmentMain onFinish={handleFinish} />}
    </LessonLayout>
  );
};

export default index;
