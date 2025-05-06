import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StudentList from "../reusable/StudentList";
import TeacherHeader from "../reusable/TeacherHeader";


function Dashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear token
    navigate("/teacher-login");
  };

  //fetch student data from the API
    useEffect(() => {
      const fetchStudents = async () => {
        try {
          const token = localStorage.getItem("token");
          console.log("Token:", token);
  
          if (!token) {
            console.error("No token found, user is not authenticated.");
            navigate("/teacher-login");
            return;
          }
  
          const response = await axios.get("http://localhost:8080/api/students/all", {
            headers: { "Authorization": `Bearer ${token}` },
          });
          setStudents(response.data.map(student => ({ ...student, showPassword: false })));
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      };
  
      fetchStudents();
    }, []);

  return (
       <div className="flex h-screen w-full bg-gray-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white p-5 shadow-md">
        <h2 className="text-xl font-bold">spedermath</h2>
        <nav className="mt-5">
          <ul>
            <li className="p-3 bg-gray-800 text-white rounded-md">Dashboard</li>
            <li className="p-3 hover:bg-gray-300 rounded-md" onClick={() => {navigate("/manage-students")}}>Manage Students</li>
            <li className="p-3 hover:bg-gray-300 rounded-md">Settings</li>
            <li className="p-3 hover:bg-gray-300 rounded-md cursor-pointer" onClick={handleLogout}>Logout</li>
          </ul>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col">
        {/* Header */}
        <TeacherHeader/>
        
        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1">
          {/* Student Progress Section */}
        <section className="lg:col-span-2 bg-white p-4 shadow-md rounded-md flex flex-col h-full"> 
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Student Progress</h3>
            <input
              type="text"
              placeholder="Search for students..."
               className="border rounded-xl px-4 py-2 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-xs
                focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {/* Progress Charts Here*/}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            {/* Placeholder for progress charts 1 */}
            <div className="h-full bg-gray-200 rounded-md"></div>
            <div className="space-y-4">
              <div className="h-60 bg-gray-300 rounded-md"></div>
              <div className="h-50 bg-gray-400 rounded-md"></div>
            </div>
          </div>
        </section>
          
          {/* Students List Section */}
          <StudentList students={students} />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
