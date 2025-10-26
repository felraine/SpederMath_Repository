import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/views/TeacherLogin";
import Register from "./components/views/Register";
import Landing from "./components/views/Landing";
import Dashboard from "./components/views/TeacherDashboard";
import ManageStudent from "./components/views/ManageStudents";
import PrivateRoute from "./components/PrivateRoute";
import StudentLogin from "./components/views/StudentLogin";
import StudentDashboard from "./components/views/StudentDashboard";
import LessonLoader from "./components/views/LessonLoader";
import SpederLayout from "./components/views/SpederLayout";
import Settings from "./components/views/Settings"; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/teacher-login" element={<Login />} />
        <Route path="/student-login" element={<StudentLogin />} />

        {/* Teacher Routes wrapped in SpederLayout */}
        <Route
          path="/teacher-dashboard"
          element={
            <PrivateRoute>
              <SpederLayout>
                <Dashboard />
              </SpederLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/manage-students"
          element={
            <PrivateRoute>
              <SpederLayout>
                <ManageStudent />
              </SpederLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SpederLayout>
                <Settings />
              </SpederLayout>
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
