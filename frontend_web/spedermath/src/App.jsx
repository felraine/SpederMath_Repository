import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/views/teacherlogin";
import Register from "./components/views/Register";
import Landing from "./components/views/Landing";
import Dashboard from "./components/views/teacherdashboard";
import ManageStudent from "./components/views/manageStudents";
import PrivateRoute from "./components/PrivateRoute";
import StudentLogin from "./components/views/StudentLogin";
import StudentDashboard from "./components/views/studentdashboard";
import Test from "./components/views/test";
import LessonLoader from "./components/views/LessonLoader";  // <-- new

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/teacher-login" element={<Login />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/test" element={<Test />} />

        {/* Protected Routes */}
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

        {/* Dynamic Lesson Route */}
        <Route
          path="/lessons/:lessonId"
          element={
            <PrivateRoute>
              <LessonLoader />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
