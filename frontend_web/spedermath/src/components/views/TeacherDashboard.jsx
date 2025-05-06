import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StudentList from "../reusable/StudentList";
import TeacherHeader from "../reusable/TeacherHeader";
import StudentProgress from "../reusable/StudentProgress";

function Dashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [lessonStats, setLessonStats] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear token
    navigate("/teacher-login");
  };

  // Fetch student data from the API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Token:", token);

        if (!token) {
          console.error("No token found, user is not authenticated.");
          navigate("/teacher-login");
          return;
        }

        const response = await axios.get("http://localhost:8080/api/students/all", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        setStudents(response.data.map(student => ({ ...student, showPassword: false })));
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    // Fetch lesson stats
    const fetchLessonStats = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.error("No token found, user is not authenticated.");
          navigate("/teacher-login");
          return;
        }

        const response = await axios.get("http://localhost:8080/api/lesson-stats", {
          headers: { "Authorization": `Bearer ${token}` },
        });

        setLessonStats(response.data);
      } catch (error) {
        console.error("Error fetching lesson stats:", error);
      }
    };

    fetchStudents();
    fetchLessonStats();
  }, [navigate]);

  return (
    <div className="flex h-screen w-full bg-gray-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white p-5 shadow-md">
        <h2 className="text-xl font-bold">spedermath</h2>
        <nav className="mt-5">
          <ul>
            <li className="p-3 bg-gray-800 text-white rounded-md">Dashboard</li>
            <li className="p-3 hover:bg-gray-300 rounded-md" onClick={() => { navigate("/manage-students") }}>Manage Students</li>
            <li className="p-3 hover:bg-gray-300 rounded-md">Settings</li>
            <li className="p-3 hover:bg-gray-300 rounded-md cursor-pointer" onClick={handleLogout}>Logout</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col">
        {/* Header */}
        <TeacherHeader />

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5 flex-1">
          {/* Student Progress Section (Full width on lg) */}
          {lessonStats.length > 0 ? (
            <StudentProgress lessonStats={lessonStats} />
          ) : (
            <section className="lg:col-span-2 bg-white p-4 shadow-md rounded-md flex justify-center items-center h-full">
              <p>Loading progress...</p>
            </section>
          )}

          {/* Students List Section */}
          <StudentList students={students} />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
