import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StudentList from "../reusable/StudentList";
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
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchStudents = async () => {
      setIsStudentLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/teacher-login");

        const response = await axios.get(`${API_BASE}/api/students/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const hydrated = (response.data || []).map((s) => ({ ...s, showPassword: false }));
        setStudents(hydrated);
      } catch (error) {
        console.error("Error fetching students:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/teacher-login");
        }
      } finally {
        setIsStudentLoading(false);
      }
    };

    const fetchLessonStats = async () => {
      setIsLessonStatsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/teacher-login");

        const response = await axios.get(`${API_BASE}/api/lesson-stats`, {
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

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 min-h-0"> {/* Important: allows scrolling inside */}
        {/* Responsive Grid */}
        <div className="
          grid 
          grid-cols-1 
          md:grid-cols-2 
          lg:grid-cols-3 
          gap-4 md:gap-6 
          h-full
        ">
          {/* Student Progress Chart - Full width on mobile, half on tablet, third on desktop */}
          <div className="
            col-span-1 
            md:col-span-2 
            lg:col-span-2 
            min-h-96
          ">
            <StudentProgress
              lessonStats={lessonStats}
              isLoading={isLessonStatsLoading}
            />
          </div>

          {/* Student List - Full width on mobile, half on tablet, third on desktop */}
          <div className="
            col-span-1 
            md:col-span-2 
            lg:col-span-1 
            min-h-96
          ">
            <StudentList
              students={students}
              isLoading={isStudentLoading}
              onSelect={handleSelectStudent}
            />
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
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