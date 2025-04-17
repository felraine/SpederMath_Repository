import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/students/student-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (response.ok) {
        if (result.token) {
          localStorage.setItem("token", result.token);
          navigate("/student-dashboard");
        } else {
          setErrorMsg("Login failed: No token received.");
        }
      } else {
        setErrorMsg(result.message || "Login failed: Invalid username or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("An error occurred. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden font-sans">
      <motion.div
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 1 }}   
        className="p-5 text-3xl md:text-4xl font-bold text-black z-50 relative"
      >
        <Link to="/"> SpederMath </Link>
      </motion.div>

      <div className="flex flex-col items-center justify-center h-[85vh] space-y-3">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-3xl font-neucha text-black"
        >
          WELCOME TO
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-5xl font-neucha text-black mb-4"
        >
          SPEDERMATH
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="text-base text-black mb-8"
        >
          Hello Student, input your secret code and password
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="flex flex-col gap-4 w-[487px]"
        >   
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Student Code"
            className="border border-gray-300 rounded-[12px] px-4 py-3 text-[16px] font-neucha focus:outline-none focus:ring-2 focus:ring-[#6a4fa3] transition"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="border border-gray-300 rounded-[12px] px-4 py-3 text-[16px] font-neucha focus:outline-none focus:ring-2 focus:ring-[#6a4fa3] transition"
          />

          {errorMsg && (
            <div className="text-red-500 text-sm font-neucha">{errorMsg}</div>
          )}

          <motion.button
            onClick={handleLogin}
            className="bg-[#6a4fa3] hover:bg-[#563d91] text-white font-bold text-[18px] tracking-wide py-[13px] rounded-[18px] cursor-pointer font-neucha transition"
          >
            Login
          </motion.button>
        </motion.div>
      </div>

      {/* Decorative Images */}
      <motion.img src="/red.png" alt="red" className="absolute bottom-[152px] left-[-152px] w-[550px]" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: "easeOut", delay: 2.5 }} />
      <motion.img src="/yellow.png" alt="yellow" className="absolute bottom-[-160px] left-[-145px] w-[500px] rotate-[30deg]" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 3, ease: "easeOut" }} />
      <motion.img src="/blue.png" alt="blue" className="absolute top-[40px] right-[-150px] w-[300px] rotate-[-39deg]" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, delay: 3.5, ease: "easeOut" }} />
      <motion.img src="/pink.png" alt="pink" className="absolute bottom-[-40px] right-[-30px] w-[350px]" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, delay: 4, ease: "easeOut" }} />
    </div>
  );
}

export default StudentLogin;
