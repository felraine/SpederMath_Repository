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
    "absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-sm bg-indigo-50 text-indigo-900 rounded-md " +
    "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50";

  // Helper for smoother label animation
  const labelClass = `overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-400 ease-in-out will-change-[opacity,max-width]`;

  return (
    <aside
      className={`h-screen ${expanded ? "w-64" : "w-20"} transition-all duration-300`}
    >
      <nav
        className="h-full flex flex-col bg-white"
        style={{
          borderRight: "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="p-4 pb-2 flex justify-between items-center">
          <h2
            className={`text-xl font-bold text-black-700 transition-all ${
              expanded ? "block" : "hidden"
            }`}
          >
            spedermath
          </h2>
          <button
            onClick={() => setExpanded((curr) => !curr)}
            className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? <ChevronFirst /> : <ChevronLast />}
          </button>
        </div>

        <nav className="mt-5 px-3 flex-1">
          <ul className="space-y-2">
            {/* Dashboard */}
            <li
              onClick={() => navigate("/teacher-dashboard")}
              className={`flex cursor-pointer group relative items-center rounded-md px-3 py-3 gap-3
                ${
                  isActive("/teacher-dashboard")
                    ? "bg-indigo-100 font-semibold"
                    : "hover:bg-indigo-50 text-gray-700"
                }
              `}
            >
              <div className="w-12 flex items-center justify-center">
                <Home size={20} />
              </div>
              <span
                className={`${labelClass} ${
                  expanded ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
                }`}
              >
                Dashboard
              </span>
              {!expanded && !isActive("/teacher-dashboard") && (
                <div
                  className={tooltipClasses}
                  style={{ boxShadow: "0 0 8px rgba(99, 102, 241, 0.5)" }}
                >
                  Dashboard
                </div>
              )}
            </li>

            {/* Manage Students */}
            <li
              onClick={() => navigate("/manage-students")}
              className={`flex cursor-pointer group relative items-center rounded-md px-3 py-3 gap-3
                ${
                  isActive("/manage-students")
                    ? "bg-indigo-100 font-semibold"
                    : "hover:bg-indigo-50 text-gray-700"
                }
              `}
            >
              <div className="w-12 flex items-center justify-center">
                <Users size={20} />
              </div>
              <span
                className={`${labelClass} ${
                  expanded ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
                }`}
              >
                Manage Students
              </span>
              {!expanded && !isActive("/manage-students") && (
                <div
                  className={tooltipClasses}
                  style={{ boxShadow: "0 0 8px rgba(99, 102, 241, 0.5)" }}
                >
                  Manage Students
                </div>
              )}
            </li>

            {/* Settings */}
            <li
              onClick={() => navigate("/settings")}
              className={`flex cursor-pointer group relative items-center rounded-md px-3 py-3 gap-3
                ${
                  isActive("/settings")
                    ? "bg-indigo-100 font-semibold"
                    : "hover:bg-indigo-50 text-gray-700"
                }
              `}
            >
              <div className="w-12 flex items-center justify-center">
                <Settings size={20} />
              </div>
              <span
                className={`${labelClass} ${
                  expanded ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
                }`}
              >
                Settings
              </span>
              {!expanded && !isActive("/settings") && (
                <div
                  className={tooltipClasses}
                  style={{ boxShadow: "0 0 8px rgba(99, 102, 241, 0.5)" }}
                >
                  Settings
                </div>
              )}
            </li>

            {/* Logout */}
            <li
              onClick={handleLogout}
              className={`flex cursor-pointer group relative items-center rounded-md px-3 py-3 gap-3
                ${
                  expanded
                    ? "hover:bg-red-100 text-red-600"
                    : "hover:bg-red-100 text-red-600"
                }
              `}
            >
              <div className="w-12 flex items-center justify-center text-red-600">
                <LogOut size={20} />
              </div>
              <span
                className={`${labelClass} ${
                  expanded ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
                }`}
              >
                Logout
              </span>
              {!expanded && (
                <div
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-sm bg-red-100 text-red-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
                  style={{ boxShadow: "0 0 8px rgba(239, 68, 68, 0.5)" }}
                >
                  Logout
                </div>
              )}
            </li>
          </ul>
        </nav>
      </nav>
    </aside>
  );
}

export default Sidebar;
