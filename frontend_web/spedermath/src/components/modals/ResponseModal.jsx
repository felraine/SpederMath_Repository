import React from "react";

const ResponseModal = ({ message, onClose, isError = false }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#707070]/60 z-50 font-['Montserrat_Alternates']">
      <div className="bg-white rounded-[20px] shadow-xl w-[500px] h-[250px] px-6 pt-6 pb-6 text-center flex flex-col items-center justify-between">
        <div className="flex flex-col items-center">
          <img
            src={isError ? "/xmark.png" : "/checkmark.png"}
            alt={isError ? "error icon" : "success icon"}
            className="w-24 h-24 mb-2"
          />
          <h2 className="text-[20px] font-black text-black leading-tight mt-1">
            {message}
          </h2>
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={onClose}
            className={`${
              isError
                ? "bg-[#ff5953] hover:bg-[#ff4640]"
                : "bg-[#00C851] hover:bg-[#00b645]"
            } text-white text-[18px] font-bold w-[150px] h-[50px] rounded-[20px] transition`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseModal;
