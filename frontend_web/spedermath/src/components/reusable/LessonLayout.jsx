import React from "react";
import { useNavigate } from "react-router-dom";

const LessonLayout = ({ lesson, progress, children, showWrong }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Always go back one page in history
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#FFEFD5] font-neucha flex flex-col items-center px-4 py-6 relative">
      {/* TOP-RIGHT Progress Label */}
      <div className="absolute top-[90px] right-[130px] text-[20px] font-neucha">
        {progress}
      </div>

      {/* Header Row: Back Button + Centered Title */}
      <div className="w-full max-w-[1200px] flex items-center justify-start mb-4">
        <button onClick={handleBack} className="-mt-6">
          <img
            src="/Back Button.png"
            alt="Back"
            className="w-8 h-8 md:w-10 md:h-10 hover:scale-105 transition"
          />
        </button>

        {/* Centered Title */}
        <div className="flex-1 text-center -ml-8 ">
          <h1 className="font-neucha text-[30px] mt-8">
            {lesson ? `Level ${lesson.lessonid}: ${lesson.title}` : "Loading..."}
          </h1>
        </div>
      </div>

      {/* Gray Lesson Container */}
     <div
  className="w-full max-w-[1150px] bg-[#F1F2F6] px-8 py-10 mt-3 rounded-xl shadow-md border border-black h-[500px] box-border"
  style={{
      outline: showWrong ? "6px solid rgba(220, 38, 38, 0.85)" : "none",
          outlineOffset: showWrong ? "0px" : "0px",
          boxShadow: showWrong
            ? "0 0 20px 6px rgba(220, 38, 38, 0.85)"
            : "0 4px 10px rgba(0, 0, 0, 0.1)",
        }}
        aria-live="polite"
        aria-atomic="true"
      >
    {children}
  </div>
    </div>
  );
};

export default LessonLayout;
