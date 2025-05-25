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

    const fetchStudent = async (id) => {
      try {
        const response = await fetch(`http://localhost:8080/api/students/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setStudent(data);
        }
      } catch (error) {
        console.error("Error fetching student info:", error);
      }
    };

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
    <div className="bg-white min-h-screen p-8 font-[Comic Sans MS]">
      {/* Exit Button */}
      <div className="absolute top-6 right-6">
        <button
           onClick={() => setShowLogoutModal(true)}
          className="border border-black px-3 py-1 rounded hover:bg-gray-200"
        >
          ➤ EXIT
        </button>
      </div>

      {/* Greeting */}
      <div className="text-center my-12">
        <h1 className="text-4xl font-bold">
          HELLO {student ? `${student.fname.toUpperCase()} ${student.lname.toUpperCase()}` : "..."}
        </h1>
        <p className="text-lg mt-2">WELCOME BACK!</p>
      </div>

      {/* Lesson Grid */}
      <div>
        <h2 className="text-xl mb-4">YOUR LESSONS</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {lessons.map((lesson, idx) => {
            const isUnlocked = checkLessonUnlock(lesson);
            return (
              <div
                key={lesson.lessonID}
                onClick={() => {
                  if (isUnlocked) navigate(`/lessons/${lesson.lessonID}`);
                }}
                className={`w-full h-40 rounded-xl border-2 text-center flex flex-col justify-center items-center transition ${
                  isUnlocked
                    ? "bg-white border-black cursor-pointer hover:shadow-xl"
                    : "bg-red-400 border-red-600 cursor-not-allowed"
                } relative`} 
              >
                {/* For the Missing Number Quest lesson*/}
                {lesson.lessonID === 1 && (
                  <>
                  
                    <div className="absolute top-8 right-2 flex gap-10">
                      <img src="/moon.png" alt="Moon Icon" className="w-8 h-8" />
                    </div>

                   
                    <div className="absolute top-2 right-8">
                      <img src="/moon.png" alt="Moon Icon" className="w-5 h-5" />
                    </div>

                    
                    <div className="absolute bottom-2 right-2">
                      <img src="/map.png" alt="Map Icon" className="w-8 h-8" />
                    </div>

                    {/* Numbers 1, 2, 3 in the lower-left corner with scattered layout */}
                    <div className="absolute bottom-2 left-2 flex flex-col text-xl font-bold text-black" style={{ fontFamily: 'Comic Sans MS, sans-serif' }}>
                      <div className="mb-0 transform translate-x-2 translate-y-2 rotate-25">1</div>
                      <div className="mb-1 transform translate-x-5 translate-y-3 rotate-20">2</div>
                      <div className="mb-0 transform translate-x-1 translate-y-2px -rotate-12">3</div>
                      <div className="mb-5 transform translate-x-6 translate-y-3 rotate-20">?</div>
                    </div>
                  </>

                  
                )}

                {lesson.lessonID === 2 && isUnlocked && (
                  <>
                    <div className="absolute top-2 left-7 transform -translate-x-2 -translate-y-1/2">
                      <img src="/turtle.png" alt="Large Turtle" className="w-12 h-12" />
                    </div>

                    <div className="absolute top-10 left-6 transform -translate-x-1/2">
                      <img src="/turtle.png" alt="Small Turtle 1" className="w-6 h-6" />
                    </div>

                    <div className="absolute top-14 left-10 transform -translate-x-1/2">
                      <img src="/turtle.png" alt="Small Turtle 2" className="w-6 h-6" />
                    </div>

                    <div className="absolute bottom-2 left-2">
                      <img src="/bat.png" alt="Bat Icon" className="w-8 h-8" />
                    </div>

                    <div className="absolute bottom-2 left-10">
                      <img src="/bat.png" alt="Bigger Bat Icon" className="w-15 h-15" />
                    </div>

                    <div className="absolute top-2 right-2">
                      <img src="/flamingo.png" alt="Flamingo Icon" className="w-20 h-15" />
                    </div>

                    <div className="absolute bottom-2 right-10">
                      <img src="/cow.png" alt="Cow Icon" className="w-25 h-19" />
                    </div>
                  </>
                )}
                {lesson.lessonID === 3 && isUnlocked && (
                  <>
                    <div className="absolute bottom-0 right-4">
                      <img src="/monkeySelfie.png" alt="Monkey Selfie" className="w-28 h-28" />
                    </div>

                    <div className="absolute bottom-0 left-2">
                      <img src="/mandrillSmile.png" alt="Mandrill Smile" className="w-24 h-20" />
                    </div>
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
          {Array(6 - lessons.length)
            .fill(null)
            .map((_, i) => (
              <div
                key={i}
                className="w-full h-40 rounded-xl bg-red-400 border-2 border-red-600 flex items-center justify-center text-4xl text-white"
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
