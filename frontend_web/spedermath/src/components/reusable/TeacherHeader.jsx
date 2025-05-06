import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function TeacherHeader() {
  const [teacherName, setTeacherName] = useState("");
  const [plan, setPlan] = useState("Free Plan");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          navigate("/teacher-login");
          return;
        }

        const decoded = jwtDecode(token);
        const teacherId = decoded.id || decoded.teacherId || decoded.sub;

        if (!teacherId) {
          console.error("Teacher ID not found in token");
          return;
        }

        const response = await axios.get(`http://localhost:8080/api/teachers/id/${teacherId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTeacherName(response.data.name);
      } catch (error) {
        console.error("Error fetching teacher info:", error);
      }
    };

    fetchTeacher();
  }, [navigate]);

  return (
    <header className="flex justify-between items-center bg-white p-4 shadow-md rounded-md">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        <div>
          <h3 className="font-semibold">Teacher {teacherName}</h3>
          <p className="text-sm text-gray-500">Hello! Welcome back!</p>
        </div>
      </div>
      <p className="text-sm text-gray-500">{plan}</p>
    </header>
  );
}

export default TeacherHeader;