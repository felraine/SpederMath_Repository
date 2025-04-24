import React from "react";

const LogoutModal = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#707070]/60 z-50 font-['Montserrat_Alternates']">
      <div className="bg-white border-[3px] border-black rounded-[20px] shadow-xl w-[500px] h-[250px] px-6 pt-4 pb-4 text-center flex flex-col items-center justify-between">
        <div className="flex flex-col items-center -mt-2">
          <img
            src="/crying_character.png"
            alt="crying icon"
            className="w-28 h-28 mb-[-8px]"
          />
          <h2 className="text-[20px] font-black text-black leading-tight">
            Are you sure you want to<br />log out?
          </h2>
        </div>
        <div className="flex justify-center gap-20 mt-1">
          <button
            onClick={onClose}
            className="bg-[#FF6B6B] hover:bg-[#ff4f4f] text-white text-[20px] font-bold w-[150px] h-[50px] rounded-[20px] transition"
          >
            no
          </button>
          <button
            onClick={onConfirm}
            className="bg-[#1C90F3] hover:bg-[#137de5] text-white text-[20px] font-bold w-[150px] h-[50px] rounded-[20px] transition transform -scale-x-100"
          >
            <span className="block transform scale-x-[-1]">yes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
