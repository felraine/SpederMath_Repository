import React, { useState } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import ReactQRCode from "react-qr-code";

function StudentRow({ student, togglePassword, onEdit }) {
  const [showQRCode, setShowQRCode] = useState(false);

  // Generate a direct login URL with credentials
  const generateQRCodeData = (student) => {
    const baseUrl = "http://localhost:5173/student-login";
    const query = `?username=${encodeURIComponent(student.username)}&password=${encodeURIComponent(student.password)}`;
    return baseUrl + query;
  };

  return (
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
      <td className="p-3">{student.level}</td>
      <td className="p-3 text-center relative">
        <button onClick={() => onEdit(student)}>
          <Pencil className="text-blue-600 hover:text-blue-800" />
        </button>
        <button className="ml-2 text-red-600 hover:text-red-800">
          <Trash2 />
        </button>
        <button
          className="ml-2 text-green-600 hover:text-green-800"
          onClick={() => setShowQRCode(!showQRCode)}
        >
          <span className="w-5 h-5">QR</span>
        </button>

        {showQRCode && (
          <div className="absolute top-0 right-0 bg-white p-4 shadow-lg z-10 border rounded">
            <ReactQRCode value={generateQRCodeData(student)} size={128} />
            <div className="mt-2 flex justify-center">
              <button
                className="text-sm text-red-600 hover:underline"
                onClick={() => setShowQRCode(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

export default StudentRow;
