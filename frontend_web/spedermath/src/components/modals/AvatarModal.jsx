import React from "react";

const AvatarModal = ({ choices = [], onSelect, onUpload, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-xl w-[420px] max-w-[95vw] p-6">
        <h3 className="text-lg font-semibold text-center mb-5">Choose an Avatar</h3>

        {/* Grid of system avatars */}
        <div className="grid grid-cols-3 gap-4 justify-items-center mb-6">
          {choices.map((pic, i) => (
            <button
              key={i}
              className="rounded-full overflow-hidden w-20 h-20 ring-1 ring-gray-200 hover:ring-4 hover:ring-blue-400 transition"
              onClick={() => onSelect && onSelect(pic)}
              title="Use this avatar"
            >
              <img src={pic} alt={`avatar-${i}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Upload */}
        <div className="flex justify-center">
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full">
            Upload your own
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </label>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="mt-6 block mx-auto text-gray-500 hover:text-black"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AvatarModal;
