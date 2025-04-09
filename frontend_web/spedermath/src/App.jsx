import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/views/teacherlogin";
import Register from "./components/views/register";
import Landing from "./components/views/landing";
import Dashboard from "./components/views/teacherdashboard";
import ManageStudent from "./components/views/manageStudents";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/teacher-login" element={<Login />} />

        {/* Add Protected Routes Here*/}
        <Route
          path="/teacher-dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/manage-students"
          element={
            <PrivateRoute>
              <ManageStudent />
            </PrivateRoute>
          }
          />
      </Routes>
    </Router>
  );
}

export default App;
