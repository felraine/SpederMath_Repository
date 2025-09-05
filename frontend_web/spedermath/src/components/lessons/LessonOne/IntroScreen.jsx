import React, { useEffect, useState } from "react";
import { Volume2, Play } from "lucide-react"; // icons for audio + start

const IntroScreen = ({ onNext }) => {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio("/audio/lesson1/intro.mp3");
    setIsAudioPlaying(true);
    audio.play();

    audio.onended = () => {
      setIsAudioPlaying(false);
    };

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      {/* Friendly character / mascot */}
      <img
        src="/munchie/eyelessneutral_Munchie.png"
        alt="Friendly Mascot"
        className="w-40 h-40 mb-6 animate-bounce"
      />

      {/* Title */}
      <h1 className="text-5xl font-bold text-blue-700 mb-4">
        👋 Welcome, Friend!
      </h1>

      {/* Subtext */}
      <p className="text-2xl text-gray-700 mb-10 flex items-center justify-center gap-2">
        <Volume2 className="w-6 h-6 text-green-600" />
        Let’s learn numbers <span className="font-bold text-red-500">1</span>,{" "}
        <span className="font-bold text-blue-500">2</span>, and{" "}
        <span className="font-bold text-green-500">3</span>!
      </p>

      {/* Big Start Button */}
      <button
        onClick={onNext}
        disabled={isAudioPlaying}
        className={`flex items-center gap-3 px-10 py-5 text-2xl font-bold rounded-2xl shadow-lg transition transform ${
          isAudioPlaying
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-green-500 text-white hover:bg-green-600 hover:scale-105"
        }`}
      >
        <Play className="w-7 h-7" />
        Start Learning
      </button>
    </div>
  );
};

export default IntroScreen;
