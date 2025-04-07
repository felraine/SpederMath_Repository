import React from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear token
    navigate("/teacher-login");
  };

  return (
       <div className="flex h-screen w-full bg-gray-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white p-5 shadow-md">
        <h2 className="text-xl font-bold">spedermath</h2>
        <nav className="mt-5">
          <ul>
            <li className="p-3 bg-gray-800 text-white rounded-md">Dashboard</li>
            <li className="p-3 hover:bg-gray-300 rounded-md">Manage Students</li>
            <li className="p-3 hover:bg-gray-300 rounded-md">Settings</li>
            <li className="p-3 hover:bg-gray-300 rounded-md cursor-pointer" onClick={handleLogout}>Logout</li>
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
              {/*Placeholder teacher name, to be changed */}
              <h3 className="font-semibold">Teacher Leilah Garcia</h3>
              <p className="text-sm text-gray-500">Hello, welcome back!</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Premium Plan</p>
        </header>
        
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
          
          <section className="bg-white p-4 shadow-md rounded-md">
            <h3 className="font-semibold">Students <span className="text-gray-500">4</span></h3>
            {/* Placeholder students*/}
            <div className="mt-4 space-y-4">
              {["Juan Tinapay", "Jarlene Santos", "Miguel San Jose", "Wayne Baguio"].map((student, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-200 rounded-md">
                  <div className="w-10 h-10 bg-gray-400 rounded-full"></div>
                  <span className="font-semibold">{student}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
