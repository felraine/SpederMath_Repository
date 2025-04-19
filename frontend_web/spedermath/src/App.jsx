import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/views/teacherlogin";
import Register from "./components/views/Register";
import Landing from "./components/views/Landing";
import Dashboard from "./components/views/TeacherDashboard";
import ManageStudent from "./components/views/ManageStudents";
import PrivateRoute from "./components/PrivateRoute";
import StudentLogin from "./components/views/StudentLogin";
import StudentDashboard from "./components/views/StudentDashboard";
import Test from "./components/views/test";
import CountLesson from "./components/views/CountLesson";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/teacher-login" element={<Login />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/test" element={<Test />} />

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
          <Route
          path="/student-dashboard"
          element={
            <PrivateRoute>
              <StudentDashboard />
            </PrivateRoute>
          }
          />
          <Route
          path="/lessons/1"
          element={
            <PrivateRoute>
              <CountLesson />
            </PrivateRoute>
          }
          />
      </Routes>
    </Router>
  );
}

export default App;
