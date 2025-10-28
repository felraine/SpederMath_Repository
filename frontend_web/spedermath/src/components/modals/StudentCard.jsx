// src/components/StudentCard.jsx
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import StudentAssessmentModal from "./StudentAssessmentModal";

/* Custom filled sparkle icon */
const FilledSparkle = ({ className = "", color = "#FACC15", size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={color} width={size} height={size} className={className}>
    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
    <path d="M6 13L6.8 16L10 16.8L6.8 17.6L6 20.8L5.2 17.6L2 16.8L5.2 16L6 13Z" />
    <path d="M17 14L17.6 16L20 16.6L17.6 17.2L17 19.6L16.4 17.2L14 16.6L16.4 16L17 14Z" />
  </svg>
);

function StudentCard({
  open = false,
  student = null,
  onClose = () => {},
  children,
  hasAttempts = true,
}) {
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !student) return null;
  const fullName = `${student.fname ?? ""} ${student.lname ?? ""}`.trim();

  return (
    <>
      {/* Student Card modal (base layer) */}
      <div className="fixed inset-0 z-[9999]">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Student details"
        >
          <div
            className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5">
              <h3 className="font-bold text-lg truncate">Student Details</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="pl-5 pr-5 pb-2 pt-2">
              {/* Avatar + Name + Username + AI Assessment button */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <img
                    src="/display-pic.png"
                    alt={fullName || "Student"}
                    className="w-16 h-16 rounded-full object-cover border"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-base truncate">
                      {fullName || "Unnamed Student"}
                    </div>
                    <div className="text-xs text-gray-600 break-all">
                      {student.username ? `@${student.username}` : "-"}
                    </div>
                  </div>
                </div>

                {/* AI Assessment button (opens top modal) */}
                <button
                  type="button"
                  onClick={() => setShowAI(true)}
                  className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium
                             text-white shadow-sm active:scale-95 transition
                             bg-gradient-to-r from-indigo-400 to-indigo-900 hover:opacity-90"
                >
                  <FilledSparkle className="w-5 h-5" color="#FACC15" />
                  AI Assessment
                </button>
              </div>

              {/* Details slot */}
              {hasAttempts ? (
                <div>{children}</div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center h-[300px]">
                  <div className="text-gray-700 text-lg font-semibold">
                    No ASSESSMENT attempts yet.
                  </div>
                  <div className="text-gray-500 text-sm mt-1">
                    The student hasn’t completed any assessments so far.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* fade-in animation */}
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.98); }
              to { opacity: 1; transform: scale(1); }
            }
            .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
          `}
        </style>
      </div>

      {/* Top-layer AI modal */}
      <StudentAssessmentModal
        open={showAI}
        onClose={() => setShowAI(false)}
        student={student}
        endpoint={import.meta.env.VITE_AI_SUMMARY_URL ?? "http://localhost:8080/api/summarize"} // <- easy swap later
      />
    </>
  );
}

export default StudentCard;
