import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronFirst,
  ChevronLast,
  Home,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

function Sidebar({ expanded, setExpanded }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/teacher-login");
  };

  const tooltipClasses =
    "absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50";

  const labelClass = `overflow-hidden whitespace-nowrap transition-all duration-300 ${
    expanded ? "opacity-100 max-w-48" : "opacity-0 max-w-0"
  }`;

  return (
    <aside
      className={`h-screen ${expanded ? "w-56" : "w-16"} transition-all duration-300 bg-white`}
      style={{
        borderRight: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "1px 0 6px rgba(0, 0, 0, 0.08)",
      }}
    >
      <nav className="h-full flex flex-col">
        {/* Header */}
        <div className="p-3 pb-2 flex justify-between items-center">
          <h2
            className={`text-lg font-bold text-gray-800 transition-all ${
              expanded ? "block" : "hidden"
            }`}
          >
            spedermath
          </h2>
          <button
            onClick={() => setExpanded((curr) => !curr)}
            className="p-1.5 rounded hover:bg-gray-100 transition"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronFirst size={20} /> : <ChevronLast size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <ul className="flex-1 px-2 pt-2 space-y-1">
          {/* Dashboard */}
          <li
            onClick={() => navigate("/teacher-dashboard")}
            className="flex items-center rounded-md px-2 py-2.5 gap-3 cursor-pointer group relative hover:bg-gray-100 transition"
          >
            <Home size={18} className="text-gray-600" />
            <span className={`${labelClass} text-sm text-gray-700`}>
              Dashboard
            </span>
            {!expanded && (
              <div className={tooltipClasses}>Dashboard</div>
            )}
          </li>

          {/* Manage Students */}
          <li
            onClick={() => navigate("/manage-students")}
            className="flex items-center rounded-md px-2 py-2.5 gap-3 cursor-pointer group relative hover:bg-gray-100 transition"
          >
            <Users size={18} className="text-gray-600" />
            <span className={`${labelClass} text-sm text-gray-700`}>
              Manage Students
            </span>
            {!expanded && (
              <div className={tooltipClasses}>Manage Students</div>
            )}
          </li>

          {/* Settings */}
          <li
            onClick={() => navigate("/settings")}
            className="flex items-center rounded-md px-2 py-2.5 gap-3 cursor-pointer group relative hover:bg-gray-100 transition"
          >
            <Settings size={18} className="text-gray-600" />
            <span className={`${labelClass} text-sm text-gray-700`}>
              Settings
            </span>
            {!expanded && (
              <div className={tooltipClasses}>Settings</div>
            )}
          </li>

          {/* Logout */}
          <li
            onClick={handleLogout}
            className="flex items-center rounded-md px-2 py-2.5 gap-3 cursor-pointer group relative hover:bg-red-50 transition mt-4"
          >
            <LogOut size={18} className="text-red-600" />
            <span className={`${labelClass} text-sm text-red-600 font-medium`}>
              Logout
            </span>
            {!expanded && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Logout
              </div>
            )}
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;