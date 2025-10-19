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
          navigate("/teacher-login");
          return;
        }

        // sanity: validate token shape (optional)
        try {
          jwtDecode(token);
        } catch {
          localStorage.removeItem("token");
          navigate("/teacher-login");
          return;
        }

        // ✅ call /me so we never rely on numeric IDs
        const res = await axios.get("http://localhost:8080/api/teachers/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTeacherName(res.data?.name || "");
      } catch (error) {
        console.error("Error fetching teacher info:", error);
        // if unauthorized, force re-login
        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/teacher-login");
        }
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
