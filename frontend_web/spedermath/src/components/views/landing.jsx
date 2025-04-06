import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-white overflow-hidden font-sans">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 1 }}   
        className="flex items-start justify-start p-5 text-2xl font-bold text-black"

      >
        SpederMath
      </motion.div>

      {/* Main Content */}
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
          Who are you logging in as?
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="flex flex-col gap-4 w-[487px]"
        >
          <motion.button
            onClick={() => navigate("/teacher-login")}
            className="bg-[#6a4fa3] hover:bg-[#563d91] text-white font-bold text-[18px] tracking-wide py-[13px] rounded-[18px] font-['Inria_Sans'] transition"
          >
            Educator
          </motion.button>

          <motion.button
            onClick={() => navigate("/student-login")}
            className="bg-[#6a4fa3] hover:bg-[#563d91] text-white font-bold text-[18px] tracking-wide py-[13px] rounded-[18px] font-['Inria_Sans'] transition"
          >
            Student
          </motion.button>
        </motion.div>
      </div>

      <motion.img
        src="/red.png"
        alt="red"
        className="absolute bottom-[152px] left-[-152px] w-[550px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 1, ease: "easeOut", delay: 2.5 }} 
      />

      <motion.img
        src="/yellow.png"
        alt="yellow"
        className="absolute bottom-[-160px] left-[-145px] w-[500px] rotate-[30deg]"
        initial={{ opacity: 0, scale: 0.8 }} 
        animate={{ opacity: 1, scale: 1 }}   
        transition={{ duration: 1.2, delay: 3, ease: "easeOut" }} 
      />

      <motion.img
        src="/blue.png"
        alt="blue"
        className="absolute top-[40px] right-[-150px] w-[300px] rotate-[-39deg]"
        initial={{ opacity: 0, scale: 0.8 }} 
        animate={{ opacity: 1, scale: 1 }}   
        transition={{ duration: 1.4, delay: 3.5, ease: "easeOut" }}
      />

      <motion.img
        src="/pink.png"
        alt="pink"
        className="absolute bottom-[-40px] right-[-30px] w-[350px]"
        initial={{ opacity: 0, scale: 0.8 }} 
        animate={{ opacity: 1, scale: 1 }}   
        transition={{ duration: 1.6, delay: 4, ease: "easeOut" }}
      />
    </div>
  );
}

export default Landing;
