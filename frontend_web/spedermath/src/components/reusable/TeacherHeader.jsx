// TeacherHeader.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const FALLBACK = "/photos/profile_pictures/profile_man.png";

function TeacherHeader() {
  const [teacherName, setTeacherName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [plan] = useState("Free Plan");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/teacher-login");

        try { jwtDecode(token); } catch { localStorage.removeItem("token"); return navigate("/teacher-login"); }

        const res = await axios.get(`${API_BASE}/api/teachers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data || {};
        setTeacherName(data.name || "");

        // data.photoUrl is relative from backend; make it absolute + cache-buster
        if (data.photoUrl) {
          setPhotoUrl(`${API_BASE}${data.photoUrl}?t=${Date.now()}`);
        } else {
          setPhotoUrl(FALLBACK);
        }
      } catch (e) {
        console.error("Header fetch error:", e);
        if (e?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/teacher-login");
        }
      }
    };

    load();

    const onUpdated = () => load();
    window.addEventListener("teacher:updated", onUpdated)

    const onStorage = (e) => {
      if (e.key === "teacherUpdatedAt") load();
    };
    window.addEventListener("storage", onStorage);

    return () =>{
      window.removeEventListener("teacher:updated", onUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [navigate]);

  return (
    <header className="flex justify-between items-center bg-white p-4 shadow-md rounded-md">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-300">
          <img
            src={photoUrl || FALLBACK}
            alt="Teacher Avatar"
            className="w-full h-full object-cover"
            onError={() => setPhotoUrl(FALLBACK)}
          />
        </div>
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
