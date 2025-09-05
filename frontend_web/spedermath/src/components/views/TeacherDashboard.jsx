import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StudentList from "../reusable/StudentList";
import TeacherHeader from "../reusable/TeacherHeader";
import StudentProgress from "../reusable/StudentProgress";
import Sidebar from "../reusable/Sidebar";

function Dashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [lessonStats, setLessonStats] = useState([]);
  const [isStudentLoading, setIsStudentLoading] = useState(true);
  const [isLessonStatsLoading, setIsLessonStatsLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/teacher-login");
  };

  useEffect(() => {
    const fetchStudents = async () => {
      setIsStudentLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/teacher-login");
          return;
        }

        const response = await axios.get("http://localhost:8080/api/students/all", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStudents(response.data.map((student) => ({ ...student, showPassword: false })));
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setIsStudentLoading(false);
      }
    };

    const fetchLessonStats = async () => {
      setIsLessonStatsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/teacher-login");
          return;
        }

        const response = await axios.get("http://localhost:8080/api/lesson-stats", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setLessonStats(response.data);
      } catch (error) {
        console.error("Error fetching lesson stats:", error);
      } finally {
        setIsLessonStatsLoading(false);
      }
    };

    fetchStudents();
    fetchLessonStats();
  }, [navigate]);

  return (
    <div>
      <main className="flex-1 p-6 flex flex-col">
        <TeacherHeader />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5 flex-1">
          <StudentProgress lessonStats={lessonStats} isLoading={isLessonStatsLoading} />
          <StudentList students={students} isLoading={isStudentLoading} />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
