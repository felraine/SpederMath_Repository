import React from "react";

const DeleteStudentModal = ({ studentName, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-[420px] px-6 py-6 text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Confirm Deletion
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900">{studentName}</span>’s
          profile?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteStudentModal;
