import React, { useState } from "react";
import { Eye, EyeOff, Pencil, Trash2, X } from "lucide-react";
import ReactQRCode from "react-qr-code";

function StudentRow({ student, togglePassword, onEdit, onDelete }) {
  const [showQRCode, setShowQRCode] = useState(false);

  const generateQRCodeData = (student) => {
    const baseUrl = "http://localhost:5173/student-login";
    const query = `?username=${encodeURIComponent(student.username)}&password=${encodeURIComponent(student.password)}`;
    return baseUrl + query;
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${student.fname} ${student.lname}?`)) {
      onDelete(student.studentID);
    }
  };

  return (
    <>
      <tr key={student.studentID} className="border-b hover:bg-gray-50 relative">
        <td className="p-3">{`${student.fname} ${student.lname}`}</td>
        <td className="p-3">{student.username}</td>
        <td className="p-3 flex items-center space-x-2">
          <span
            className="password-display"
            style={{
              minWidth: "80px",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {student.showPassword ? student.password : "********"}
          </span>
          <button onClick={() => togglePassword(student.studentID)}>
            {student.showPassword ? <EyeOff /> : <Eye />}
          </button>
        </td>
        <td className="p-3">
          {new Date(student.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "2-digit",
          })}
        </td>
        {/* Removed level cell */}
        <td className="p-3 text-center">
          <button onClick={() => onEdit(student)}>
            <Pencil className="text-blue-600 hover:text-blue-800" />
          </button>
          <button
            className="ml-2 text-red-600 hover:text-red-800"
            onClick={handleDelete}
          >
            <Trash2 />
          </button>
          <button
            className="ml-2 text-green-600 hover:text-green-800"
            onClick={() => setShowQRCode(true)}
          >
            <span className="w-5 h-5">QR</span>
          </button>
        </td>
      </tr>

      {showQRCode && (
        <div
          className="fixed inset-0 bg-black flex justify-center items-center z-50"
          style={{ background: "rgba(0, 0, 0, 0.3)" }}
        >
          <div className="relative bg-white p-6 rounded-lg shadow-lg text-center">
            {/* Close Button (X) */}
            <button
              onClick={() => setShowQRCode(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold mb-4">Scan QR to Login</h2>
            <ReactQRCode value={generateQRCodeData(student)} size={200} />
          </div>
        </div>
      )}
    </>
  );
}

export default StudentRow;