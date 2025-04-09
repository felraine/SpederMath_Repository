import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react"; // Lucide icons

function ManageStudent() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/teacher-login");
  };

  const [students, setStudents] = useState([
    {
      id: 1,
      name: "Juan Dela Cruz",
      username: "juan123",
      password: "secret123",
      dateCreated: "2024-04-05",
      level: "Grade 6",
      showPassword: false,
    },
    {
      id: 2,
      name: "Maria Santos",
      username: "maria456",
      password: "pass456",
      dateCreated: "2024-03-20",
      level: "Grade 5",
      showPassword: false,
    },
  ]);

  const togglePassword = (id) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, showPassword: !s.showPassword } : s
      )
    );
  };

  return (
    <div className="flex h-screen w-full bg-gray-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white p-5 shadow-md">
        <h2 className="text-xl font-bold">spedermath</h2>
        <nav className="mt-5">
          <ul>
            <li
              className="p-3 hover:bg-gray-300 rounded-md cursor-pointer"
              onClick={() => navigate("/teacher-dashboard")}
            >
              Dashboard
            </li>
            <li className="p-3 bg-gray-800 text-white rounded-md">
              Manage Students
            </li>
            <li className="p-3 hover:bg-gray-300 rounded-md">Settings</li>
            <li
              className="p-3 hover:bg-gray-300 rounded-md cursor-pointer"
              onClick={handleLogout}
            >
              Logout
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center bg-white p-4 shadow-md rounded-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div>
              <h3 className="font-semibold">Teacher Leilah Garcia</h3>
              <p className="text-sm text-gray-500">Hello! Welcome back!</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Premium Plan</p>
        </header>

        {/* Student Table */}
        <section className="bg-white p-4 shadow-md rounded-md mt-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Student List</h3>
                <input
                type="text"
                placeholder="Search for students..."
                className="border rounded-xl px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-800">
                + Create New Student
            </button>
            </div>

          <table className="min-w-full table-auto text-sm text-left">
            <thead className="bg-gray-100 font-semibold">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">Username</th>
                <th className="p-3">Password</th>
                <th className="p-3">Date Created</th>
                <th className="p-3">Level</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{student.name}</td>
                  <td className="p-3">{student.username}</td>
                  <td className="p-3 flex items-center space-x-2">
                    <span>
                      {student.showPassword ? student.password : "••••••••"}
                    </span>
                    <button
                      onClick={() => togglePassword(student.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {student.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </td>
                  <td className="p-3">{student.dateCreated}</td>
                  <td className="p-3">{student.level}</td>
                  <td className="p-3 flex items-center space-x-3 justify-center">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Pencil size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default ManageStudent;
