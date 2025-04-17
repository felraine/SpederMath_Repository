import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [student, setStudent] = useState(null);
  const [progress, setProgress] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Safe extraction of studentID from JWT
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token:", token);


    if (!token) return;

    const studentID = extractStudentIdFromToken(token);
    console.log("Student ID:", studentID);
    if (!studentID) return;

    const fetchLessons = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/lessons", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setLessons(data);
          console.log("lessons:", data); // Debug the structure
        } else {
          console.error("Failed to fetch lessons");
        }
      } catch (error) {
        console.error("Error fetching lessons:", error);
      }
    };

    const fetchStudent = async (id) => {
      try {
        const response = await fetch(`http://localhost:8080/api/students/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStudent(data);
        } else {
          console.error("Failed to fetch student info");
        }
      } catch (error) {
        console.error("Error fetching student info:", error);
      }
    };

    const fetchProgress = async (studentID) => {
      try {
        const response = await fetch(`http://localhost:8080/api/student-progress/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
    
        if (response.ok) {
          const data = await response.json();
          console.log("Progress Data:", data); // Debug the structure
          setProgress(data);
        } else {
          console.error("Failed to fetch student progress");
        }
      } catch (error) {
        console.error("Error fetching student progress:", error);
      }
    };    

    fetchLessons();
    fetchStudent(studentID);
    fetchProgress(studentID);
  }, []);

  // Determines whether a lesson is unlocked for the student
  const checkLessonUnlock = (lesson) => {
    console.log("Checking lesson:", lesson);
  
    if (!lesson || !lesson.lessonID) return false;
  
    // If it's the first lesson, it's always unlocked
    if (lesson.lessonID === 1) return true;
  
    // Get the index of the previous lesson (one less than the current lessonID)
    const previousLessonIndex = lesson.lessonID - 2; // lessonID - 1 for previous, 0-based index
  
    // Ensure the index is valid
    if (previousLessonIndex < 0 || previousLessonIndex >= lessons.length) return false;
  
    // Find the previous lesson and its associated progress
    const previousLesson = lessons[previousLessonIndex];
    const progressForPreviousLesson = progress[previousLessonIndex]; // Assuming progress array matches lessons order
  
    console.log("Previous Lesson:", previousLesson);
    console.log("Progress for previous lesson:", progressForPreviousLesson);
  
    // Ensure progress exists for the previous lesson
    if (!progressForPreviousLesson) return false;
  
    // Check if the previous lesson's score is above the unlock threshold and unlocked
    return (
      progressForPreviousLesson.score >= previousLesson.unlockThreshold &&
      progressForPreviousLesson.unlocked
    );
  };  

  return (
    <div className="relative min-h-screen bg-white px-6 py-6">
      {/* Logout Button */}
      <div className="float-right top-6 right-6">
        <img
          src="/logout-btn.png"
          alt="Logout"
          onClick={handleLogout}
          className="w-25 h-25 cursor-pointer hover:opacity-75 transition"
        />
      </div>

      {/* Greeting Section */}
      <div className="flex items-center justify-center min-h-[30vh]">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-black">
            HELLO {student ? `${student.fname} ${student.lname}` : "Loading..."}
          </h1>
          <p className="text-lg mt-2">WELCOME BACK!</p>
        </div>
      </div>

      {/* Lessons Section */}
      <div className="px-4 md:px-10 text-left">
        <h2 className="text-2xl font-semibold text-black mb-6">YOUR LESSONS</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {lessons.length > 0 ? (
            lessons.map((lesson) => {
              const isUnlocked = checkLessonUnlock(lesson);
              return (
                <div
                  key={lesson.lessonID}
                  onClick={() => {
                    if (isUnlocked) navigate(`/lessons/${lesson.lessonID}`);
                  }}
                  className={`${
                    isUnlocked
                      ? "bg-[#ffffff] p-6 rounded-2xl shadow hover:shadow-lg transition cursor-pointer border-2 border-[#000000]"
                      : "bg-[#f5f5f5] p-6 rounded-2xl shadow cursor-not-allowed border-2 border-[#cccccc]"
                  }`}
                >
                  <h3 className="text-xl font-bold text-[#6a4fa3] mb-2">
                    {lesson.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {isUnlocked
                      ? "Start your journey on this lesson!"
                      : `Unlock this lesson after reaching a score of ${lesson.unlockThreshold}`}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">No lessons available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
