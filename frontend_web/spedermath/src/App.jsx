import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/views/login";
import Register from "./components/views/register";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} /> {/* Default route to Login */}
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
