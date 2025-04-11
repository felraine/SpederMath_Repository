import React from "react";
import { useNavigate } from "react-router-dom";

function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  
  return (
    <aside className="w-64 bg-white p-5 shadow-md">
      <h2 className="text-xl font-bold">spedermath</h2>
      <nav className="mt-5">
        <ul>
          <li className="p-3 hover:bg-gray-300 rounded-md cursor-pointer" onClick={() => navigate("/teacher-dashboard")}>Dashboard</li>
          <li className="p-3 bg-gray-800 text-white rounded-md">Manage Students</li>
          <li className="p-3 hover:bg-gray-300 rounded-md">Settings</li>
          <li className="p-3 hover:bg-gray-300 rounded-md cursor-pointer" onClick={onLogout}>Logout</li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
