import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutModal from "../modals/LogoutModal";

function StudentDashboard() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [student, setStudent] = useState(null);
  const [progress, setProgress] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  }



  const extractStudentIdFromToken = (token) => {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload.sub;
    } catch (error) {
      console.error("Invalid token format:", error);
      return null;
    }
  };

  
  // Fetch lessons, student info, and progress when the component mounts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const studentID = extractStudentIdFromToken(token);
    if (!studentID) return;

    const fetchLessons = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/lessons", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const sorted = data.sort((a, b) => a.lessonOrder - b.lessonOrder);
          setLessons(sorted);
        }
      } catch (error) {
        console.error("Error fetching lessons:", error);
      }
    };

    async function fetchStudent() {
      const token =
        localStorage.getItem("studentToken") || localStorage.getItem("token");
      if (!token) throw new Error("No student token found");

      // decode studentId from JWT (adjust claim name if different)
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      const studentId = payload.studentId || payload.sid || payload.id;

      const resp = await fetch(`http://localhost:8080/api/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const contentType = resp.headers.get("content-type") || "";
      const raw = await resp.text(); // read raw so we can log/show it

      if (!resp.ok) {
        // This will show you the actual HTML/text Spring returned (403/404/etc.)
        throw new Error(`HTTP ${resp.status} – ${raw.slice(0, 300)}`);
      }

      if (!contentType.includes("application/json")) {
        throw new Error("Expected JSON but got: " + contentType + " — " + raw.slice(0, 120));
      }

      const data = JSON.parse(raw);
      setStudent(data);
    }

    const fetchProgress = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/student-progress/my", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setProgress(data);
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    };

    fetchLessons();
    fetchStudent(studentID);
    fetchProgress();
  }, []);

  const checkLessonUnlock = (lesson) => {
    if (!lesson || !lesson.lessonID) return false;
    
    // Always unlock lesson 1
    if (lesson.lessonOrder === 1) return true;

    const lessonProgress = progress.find(
      (p) => String(p.lessonId) === String(lesson.lessonID)
    );
    
    console.log("Found progress:", lessonProgress);
    return lessonProgress?.unlocked === true;
  };
  
  

  const getCardIcon = (lessonID) => {
    switch (lessonID) {
      case 1:
        return null; // No icon for Missing Number Quest card
      case 2:
        return null;
      default:
        return null;
    }
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
        <h1 className="text-5xl font-bold-monospace">
          HELLO {student ? `${student.fname.toUpperCase()} ${student.lname.toUpperCase()}` : "..."}
        </h1>
        <p className="text-lg mt-2">WELCOME BACK!</p>
      </div>

      {/* Lesson Grid */}
      <div>
        <h2 className="text-xl mb-4 m-10">YOUR LESSONS</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 m-10">
          {lessons.map((lesson, idx) => {
            const isUnlocked = checkLessonUnlock(lesson);

            return (
              <div
                key={lesson.lessonID}
                onClick={() => {
                  if (isUnlocked) navigate(`/lessons/${lesson.lessonID}`);
                }}
                className={`w-full h-40 rounded-xl border-4 border-[#333333] text-center flex flex-col justify-center items-center transition
 ${
                  isUnlocked
                    ? "bg-white border-black cursor-pointer hover:shadow-xl"
                    : "bg-red-400 border-red-600 cursor-not-allowed"
                } relative`} 
              >
                {/* LESSON ONE NUMBERS 1-3*/}
                {lesson.lessonID === 1 && (
                  <>   
                   <img
                    src="/LessonTitles/LessonOne.png"
                    alt="Lesson 1: Learning Numbers 1-3"
                    className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                  /> 
                           
                  </>      
                )}
                {/* LESSON ONE NUMBER MAZE*/}
                {lesson.lessonID === 2 && isUnlocked && (
                  <>
                    <img
                    src="/LessonTitles/NumberMaze.png"
                    alt="Lesson 1: Learning Numbers 1-3"
                    className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                  /> 
                  </>
                )}
                {/* LESSON TWO NUMBERS 1-5*/}
                {lesson.lessonID === 3 && isUnlocked && (
                  <>
                   <img
                    src="/LessonTitles/LessonTwo.png"
                    alt="Lesson 1: Learning Numbers 1-5"
                    className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                  /> 
                  </>
                )}
                {/* LESSON TWO NUMBER DROP*/}
                {lesson.lessonID === 4 && isUnlocked && (
                  <>
                  <img
                    src="/LessonTitles/NumberDrop.png"
                    alt="Lesson 2: Number Drop"
                    className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                  /> 
                  
                  </>
                )}
                {/* LESSON THREE NUMBERS 1-7*/}
                {lesson.lessonID === 5 && isUnlocked && (
                  <>
                  <img
                    src="/LessonTitles/LessonThree.png"
                    alt="Lesson 3: Learning Numbers 1-7"
                    className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                  /> 
                  
                  </>
                )}
                {/* LESSON THREE FEED MUNCHIE*/}
                {lesson.lessonID === 6 && isUnlocked && (
                  <>
                  <img
                    src="/LessonTitles/FeedMunchie.png"
                    alt="Lesson 3:Feed Munchie"
                    className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                  /> 
                  </>
                )}
                 {/* LESSON FOUR NUMBERS 1-10*/}
                {lesson.lessonID === 7 && isUnlocked && (
                  <>
                  <img
                    src="/LessonTitles/LessonFour.png"
                    alt="Lesson 4: Learning Numbers 1-10"
                    className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                  /> 
                  </>
                )}
                 {/* LESSON FOUR NUMBER STEPS*/}
                {lesson.lessonID === 8 && isUnlocked && (
                  <>
                  <img
                    src="/LessonTitles/NumberSteps.png"
                    alt="Lesson 4:Number Steps"
                    className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
                  /> 
                  </>
                )}
                {isUnlocked ? (
                  <>
                    <div className="flex gap-2">{getCardIcon(lesson.lessonID)}</div>
                    <h3 className="text-lg font-bold mt-2">{lesson.title}</h3>
                  </>
                ) : (
                  <div className="text-4xl text-white">
                  {idx <= progress.length ? (
                  <img src="/padlock.png" alt="Locked" className="w-8 h-8" />
                  ) : (
                       "?"
         )}
      </div>
                )}
              </div>
            );
          })}

          {/* Placeholder cards for locked lessons */}
          {Array(9 - lessons.length)
            .fill(null)
            .map((_, i) => (
              <div
                key={i}
                className="w-full h-40 rounded-xl bg-red-400 border-4 border-red-700 flex items-center justify-center text-4xl text-white"
              >
                ?
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
