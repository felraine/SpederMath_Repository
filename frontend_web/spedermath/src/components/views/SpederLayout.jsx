// SpederLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/reusable/Sidebar";
import TeacherHeader from "../../components/reusable/TeacherHeader";

function SpederLayout({ children, onLogout }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar expanded={expanded} setExpanded={setExpanded} onLogout={onLogout} />

      {/* Right side: header + page content */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Persisted across tabs */}
        <div className="p-4">
          <TeacherHeader />
        </div>

        {/* Page content swaps here */}
        <div className="flex-1 overflow-none p-4">
          {children ? children : <Outlet />}
        </div>
      </div>
    </div>
  );
}

export default SpederLayout;
