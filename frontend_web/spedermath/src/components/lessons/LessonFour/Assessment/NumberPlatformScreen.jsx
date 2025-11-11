// NumberPlatformScreen.jsx
import React, { useEffect, useState } from "react";
import NumberPlatform from "./NumberPlatform";
import NumberPlatformTutorial, { numberPlatformTourSteps } from "../../tutorial/NumberPlatformTutorial";

export default function NumberPlatformScreen({
  rounds = 5,
  livesPerRound = 3,
  range = [0, 10],
  lessonId = 4,
  onGameOver,
}) {
  const [showTut, setShowTut] = useState(false);
  const [step, setStep] = useState(0);
  const [minN, maxN] = range;

  const px = (v) => (typeof v === "string" ? parseFloat(v) || 0 : v || 0);

  // Delay tutorial so elements exist before measuring (after first render)
  useEffect(() => {
    const t = setTimeout(() => setShowTut(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <NumberPlatformTutorial
        open={showTut}
        steps={numberPlatformTourSteps}
        step={step}
        onPrev={() => setStep((s) => Math.max(0, s - 1))}
        onNext={() => setStep((s) => Math.min(numberPlatformTourSteps.length - 1, s + 1))}
        onClose={() => setShowTut(false)}
        modeLabel="Counting"
        targetN={minN}
        afterBase={minN}
        minN={minN}
        maxN={maxN}
      />

      <NumberPlatform
        rounds={rounds}
        livesPerRound={livesPerRound}
        range={range}
        lessonId={lessonId}
        onGameOver={onGameOver}
        enableTutorial={false}
        // IMPORTANT: these class hooks must exist inside the game for the tutorial
        classHooks={{
          hud: "np-hud",
          prompt: "np-prompt",
          avatar: "np-avatar",
          platformBottom: "np-platform-bottom",
          platformLeft: "np-platform-left",
          platformRight: "np-platform-right",
        }}
      />
    </>
  );
}
