import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-start justify-start p-5 text-2xl font-bold text-black">
        SpederMath
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center flex-grow mb-40">
        <motion.div
          initial={{ opacity: 0, y: 50 }} // Starts slightly below and invisible
          animate={{ opacity: 1, y: -30 }} // Moves up and becomes visible
          transition={{ duration: 0.8 }} // Faster transition
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-black pb-6">
            Welcome to <br />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }} // Appears after 0.5s, completes in 0.8s
              className="text-5xl"
            >
              SpederMath
            </motion.span>
          </h1>

          {/* Text & Buttons appear after the main title moves up */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }} // Appears after 1.2s, completes in 0.8s
            className="text-lg text-black mt-4 pb-10"
          >
            Who are you logging in as?
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} // Starts slightly below
            animate={{ opacity: 1, y: 0 }} // Moves into place
            transition={{ delay: 1.5, duration: 0.8 }} // Appears after 1.5s, completes in 0.8s
            className="mt-6 flex flex-col space-y-4"
          >
            <button
              className="px-6 py-3 bg-purple-700 text-white text-lg font-semibold rounded-lg hover:bg-purple-800 transition"
              onClick={() => navigate("/teacher-login")}
            >
              Teacher
            </button>
            <button
              className="px-6 py-3 bg-purple-700 text-white text-lg font-semibold rounded-lg hover:bg-purple-800 transition"
              onClick={() => navigate("/student-login")}
            >
              Student
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default Landing;
