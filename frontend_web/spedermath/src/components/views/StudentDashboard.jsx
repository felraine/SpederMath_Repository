// src/pages/StudentDashboard.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import LogoutModal from "../modals/LogoutModal";
import DashboardStars from "../reusable/DashboardStars";

function StudentDashboard() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [student, setStudent] = useState(null);
  const [progress, setProgress] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("studentToken");
    navigate("/");
  };

  const extractStudentIdFromToken = (token) => {
    if (!token) return null;
    try {
      const payload = token.split(".")[1];
      const decodedPayload = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      );
      return (
        decodedPayload.studentId ||
        decodedPayload.sid ||
        decodedPayload.sub ||
        decodedPayload.id ||
        null
      );
    } catch (error) {
      console.error("Invalid token format:", error);
      return null;
    }
  };

  // --- fetch all data on mount ---
  useEffect(() => {
    const token =
      localStorage.getItem("studentToken") || localStorage.getItem("token");
    if (!token) return;

    const studentID = extractStudentIdFromToken(token);
    if (!studentID) return;

    const fetchLessons = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/lessons", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLessons(
            data.sort((a, b) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0))
          );
        }
      } catch (e) {
        console.error("Error fetching lessons:", e);
      }
    };

    const fetchStudent = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/students/${studentID}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        const txt = await res.text();
        if (!res.ok) throw new Error(txt);
        const data = JSON.parse(txt);
        setStudent(data);
      } catch (e) {
        console.error("Error fetching student:", e);
      }
    };

    const fetchProgress = async () => {
      try {
        const res = await fetch(
          "http://localhost:8080/api/student-progress/my",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setProgress(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Error fetching progress:", e);
      }
    };

    fetchLessons();
    fetchStudent();
    fetchProgress();
  }, []);

  // --- progress helpers ---
  const progressByLessonId = useMemo(() => {
    const map = new Map();
    for (const p of progress) {
      const key = String(p.lessonId ?? p.lessonID ?? p.id ?? "");
      if (key) map.set(key, p);
    }
    return map;
  }, [progress]);

  // Map raw attempt score to the 0..10 "star scale"
  // - If it's a 5-point assessment (NumberDrop/NumberSteps), force:
  //     5/5 -> 10 (★★★), 3–4/5 -> 7 (★★), 0–2/5 -> 0..2 (★)
  // - Otherwise pass through (assumed already 0..10).
  const toStarScale = (raw, maxHint = 10, lessonId = null) => {
    const n = typeof raw === "number" ? raw : Number(raw);
    const max =
      Number(
        maxHint ??
          10
      ) || 10;

    // Try to infer 5-point games even if maxHint wasn’t provided
    const isFivePoint =
      max <= 5 ||
      [4, 8].includes(Number(lessonId)) || // Lesson 4: NumberDrop, Lesson 8: NumberSteps
      (n <= 5 && n % 1 === 0); // integer 0..5

    if (isFivePoint) {
      if (n >= 5) return 10;          // perfect -> ★★★
      if (n >= 3) return 7;           // 3–4 -> ★★
      return Math.max(0, Math.round(n)); // 0–2 -> ★
    }
    // assume already on 0..10 scale
    return Number.isFinite(n) ? Math.round(n) : 0;
  };

  const getProgressForLesson = (lessonId) =>
    progressByLessonId.get(String(lessonId));

  const getLessonScore = (lesson) => {
    const p = getProgressForLesson(lesson.lessonID);
    const raw =
      p?.bestScore ?? p?.score ?? p?.highestScore ?? p?.lastScore ?? 0;

    // try to read a hint about the max (various APIs)
    const maxHint =
      p?.maxScore ??
      p?.total ??
      p?.totalQuestions ??
      p?.rounds ??
      lesson?.maxScore ??
      10;

    return toStarScale(raw, maxHint, lesson.lessonID);
  };

  const checkLessonUnlock = (lesson) => {
    if (!lesson || !lesson.lessonID) return false;
    if (lesson.lessonOrder === 1) return true;
    const p = getProgressForLesson(lesson.lessonID);
    return p?.unlocked === true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 via-blue-200 to-white p-8 font-[Comic Sans MS] relative overflow-hidden">
      {/* Exit Button */}
      <div className="absolute top-6 right-6 mr-10">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="border border-black px-3 py-1 rounded hover:bg-gray-300 bg-white"
        >
          ➤ EXIT
        </button>
      </div>

      {/* Greeting */}
      <div className="text-center my-12">
        <h1 className="text-5xl font-bold">
          HELLO{" "}
          {student
            ? `${(student.fname || "").toUpperCase()} ${(student.lname || "").toUpperCase()}`
            : "..."}
        </h1>
        <p className="text-lg mt-2">WELCOME BACK!</p>
      </div>

      {/* Lesson Grid */}
      <div>
        <h2 className="text-xl mb-4 m-10">YOUR LESSONS</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 m-10">
          {lessons.map((lesson, idx) => {
            const isUnlocked = checkLessonUnlock(lesson);
            const score = getLessonScore(lesson); // ← normalized to star scale

            return (
              <div key={lesson.lessonID} className="flex flex-col items-center">
                {/* Card */}
                <div
                  onClick={() => {
                    if (isUnlocked) navigate(`/lessons/${lesson.lessonID}`);
                  }}
                  className={`relative w-full h-40 rounded-xl border-4 text-center flex flex-col justify-center items-center transition
                  ${
                    isUnlocked
                      ? "bg-white border-black cursor-pointer hover:shadow-xl"
                      : "bg-red-400 border-red-600 cursor-not-allowed"
                  }`}
                >
                  {/* Background images per lesson */}
                  {lesson.lessonID === 1 && (
                    <img
                      src="/LessonTitles/LessonOne.png"
                      alt="Lesson 1"
                      className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                    />
                  )}
                  {lesson.lessonID === 2 && isUnlocked && (
                    <img
                      src="/LessonTitles/NumberMaze.png"
                      alt="Lesson 2"
                      className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                    />
                  )}
                  {lesson.lessonID === 3 && isUnlocked && (
                    <img
                      src="/LessonTitles/LessonTwo.png"
                      alt="Lesson 3"
                      className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                    />
                  )}
                  {lesson.lessonID === 4 && isUnlocked && (
                    <img
                      src="/LessonTitles/NumberDrop.png"
                      alt="Lesson 4"
                      className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                    />
                  )}
                  {lesson.lessonID === 5 && isUnlocked && (
                    <img
                      src="/LessonTitles/LessonThree.png"
                      alt="Lesson 5"
                      className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                    />
                  )}
                  {lesson.lessonID === 6 && isUnlocked && (
                    <img
                      src="/LessonTitles/FeedMunchie.png"
                      alt="Lesson 6"
                      className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                    />
                  )}
                  {lesson.lessonID === 7 && isUnlocked && (
                    <img
                      src="/LessonTitles/LessonFour.png"
                      alt="Lesson 7"
                      className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                    />
                  )}
                  {lesson.lessonID === 8 && isUnlocked && (
                    <img
                      src="/LessonTitles/NumberSteps.png"
                      alt="Lesson 8"
                      className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                    />
                  )}

                  {/* Card content */}
                  {isUnlocked ? (
                    <h3 className="z-10 text-lg font-bold drop-shadow"></h3>
                  ) : (
                    <div className="z-10 text-4xl text-white">
                      {idx <= progress.length ? (
                        <img
                          src="/padlock.png"
                          alt="Locked"
                          className="w-8 h-8"
                        />
                      ) : (
                        "?"
                      )}
                    </div>
                  )}
                </div>

                {/* Stars BELOW the card (no background, centered) */}
                {isUnlocked && (
                  <div className="mt-2">
                    <DashboardStars score={score} size={40} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Placeholder for missing lessons */}
          {Array(Math.max(0, 9 - lessons.length))
            .fill(null)
            .map((_, i) => (
              <div
                key={`ph-${i}`}
                className="flex flex-col items-center w-full"
              >
                <div className="w-full h-40 rounded-xl bg-red-400 border-4 border-red-700 flex items-center justify-center text-4xl text-white">
                  ?
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <LogoutModal
          onClose={() => setShowLogoutModal(false)}
          onConfirm={confirmLogout}
        />
      )}
    </div>
  );
}

export default StudentDashboard;
