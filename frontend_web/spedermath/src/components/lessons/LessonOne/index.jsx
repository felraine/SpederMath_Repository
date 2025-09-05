import React, { useState } from "react";
import LessonLayout from "../../reusable/LessonLayout";
import IntroScreen from "./IntroScreen";
import TeachScreen from "./TeachScreen";
import PracticeScreen from "./PracticeScreen";
import PracticeScreen2 from "./PracticeScreen2";
import PracticeScreen3 from "./PracticeScreen3";
import RewardScreen from "./RewardScreen";

const LessonOne = () => {
  const [step, setStep] = useState(1);
  const nextStep = () => setStep((prev) => prev + 1);

  const lesson = { lessonid: 1, title: "Numbers 1,2,3" };
  const progress = `${step}/5`;

  return (
    <LessonLayout lesson={lesson} progress={progress}>
      {step === 1 && <IntroScreen onNext={nextStep} />}
      {step === 2 && <TeachScreen onNext={nextStep} />}
      {step === 3 && <PracticeScreen onNext={nextStep} />}
      {step === 4 && <PracticeScreen2 onNext={nextStep} />}
      {step === 5 && <PracticeScreen3 onNext={nextStep} />}
      {step === 6 && <RewardScreen />}
    </LessonLayout>
  );
};

export default LessonOne;
