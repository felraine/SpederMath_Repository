import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StudentList from "../reusable/StudentList";
import TeacherHeader from "../reusable/TeacherHeader";
import StudentProgress from "../reusable/StudentProgress";
import StudentCard from "../modals/StudentCard";
import StudentProgressDetails from "../reusable/StudentProgressDetails";

function Dashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [lessonStats, setLessonStats] = useState([]);
  const [isStudentLoading, setIsStudentLoading] = useState(true);
  const [isLessonStatsLoading, setIsLessonStatsLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/teacher-login");
  };

  useEffect(() => {
    const fetchStudents = async () => {
      setIsStudentLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/teacher-login"); return; }

        const response = await axios.get("http://localhost:8080/api/students/all", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const hydrated = (response.data || []).map((s) => ({ ...s, showPassword: false }));
        setStudents(hydrated);
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
        if (!token) { navigate("/teacher-login"); return; }

        const response = await axios.get("http://localhost:8080/api/lesson-stats", {
          headers: { Authorization: `Bearer ${token}` },
          params: { type: "ASSESSMENT" },
        });
        setLessonStats(response.data || []);
      } catch (error) {
        console.error("Error fetching lesson stats:", error);
      } finally {
        setIsLessonStatsLoading(false);
      }
    };

    fetchStudents();
    fetchLessonStats();
  }, [navigate]);

  const handleSelectStudent = (s) => {
    setSelectedStudent(s);
    setShowStudentModal(true);
  };

  return (
    <div>
      <main className="flex-1 p-6 flex flex-col">
        <TeacherHeader />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5 flex-1">
          <StudentProgress lessonStats={lessonStats} isLoading={isLessonStatsLoading} />
          <StudentList students={students} isLoading={isStudentLoading} onSelect={handleSelectStudent} />
        </div>
      </main>

      {/* Modal with progress details */}
      <StudentCard
        open={showStudentModal}
        student={selectedStudent}
        onClose={() => setShowStudentModal(false)}
      >
        {selectedStudent && (
          <StudentProgressDetails studentId={selectedStudent.studentID} />
        )}
      </StudentCard>
    </div>
  );
}

export default Dashboard;
