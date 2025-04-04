import React from "react";
import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-white overflow-hidden font-sans">
      
      <img src="/red.png" alt="red" className="absolute bottom-[152px] left-[-152px] w-[550px]" />
      <img src="/yellow.png" alt="yellow" className="absolute bottom-[-160px] left-[-145px] w-[500px] rotate-[30deg]" />
      <img src="/pink.png" alt="pink" className="absolute bottom-[-40px] right-[-30px] w-[350px]" />
      <img src="/blue.png" alt="blue" className="absolute top-[40px] right-[-150px] w-[300px] rotate-[-39deg]" />



      
      <div className="absolute top-6 left-30 text-xl font-bold text-black">
        spedermath
      </div>

      
      <div className="flex flex-col items-center justify-center h-[85vh] space-y-3">
        <h1 className="text-3xl font-neucha text-black">WELCOME TO</h1>
        <h2 className="text-5xl font-neucha text-black mb-4">SPEDERMATH</h2>
        <p className="text-base text-black mb-8">Who are you logging in as?</p>

        <div className="flex flex-col gap-4 w-[487px]">
          <button
            onClick={() => navigate("/teacher-login")}
            className="bg-[#6a4fa3] hover:bg-[#563d91] text-white font-bold text-[18px] tracking-wide py-[13px] rounded-[18px] font-['Inria_Sans'] transition"
          >
            Educator
          </button>
          <button
            onClick={() => navigate("/student-login")}
            className="bg-[#6a4fa3] hover:bg-[#563d91] text-white font-bold text-[18px] tracking-wide py-[13px] rounded-[18px] font-['Inria_Sans'] transition"
          >
            Student
          </button>
        </div>

      </div>
    </div>
  );
}

export default Landing;
