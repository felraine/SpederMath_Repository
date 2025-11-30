// SpederLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/reusable/Sidebar";
import TeacherHeader from "../../components/reusable/TeacherHeader";

function SpederLayout({ children, onLogout }) {
  const [expanded, setExpanded] = useState(true);

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {        // tablet & mobile
        setExpanded(false);
      } else {
        setExpanded(true);                   // desktop → show full
      }
    };

    handleResize(); // Run on mount
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Sidebar – controlled by expanded state */}
      <Sidebar expanded={expanded} setExpanded={setExpanded} onLogout={onLogout} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <TeacherHeader />
        <main className="flex-1 overflow-y-auto p-4">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default SpederLayout;