import React, { useState } from "react";
import { Eye, EyeOff, Pencil, Trash2, X } from "lucide-react";
import ReactQRCode from "react-qr-code";
import axios from "axios";
import DeleteStudentModal from "../modals/DeleteStudentModal"; 

function StudentRow({ student, togglePassword, onEdit, onDelete }) {
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [loadingQR, setLoadingQR] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); 
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const handleDeleteConfirm = () => {
    onDelete(student.studentID);
    setShowDeleteModal(false);
  };

  const handleGenerateQR = async () => {
    try {
      setLoadingQR(true);
      const res = await axios.post(
        `${API_BASE}/api/students/${student.studentID}/qr-token`
      );
      const { qrUrl } = res.data;
      setQrUrl(qrUrl);
      setShowQRCode(true);
    } catch (err) {
      console.error(err);
      alert("Failed to generate QR code token.");
    } finally {
      setLoadingQR(false);
    }
  };

  return (
    <>
      <tr key={student.studentID} className="border-b hover:bg-gray-50 relative">
        <td className="p-3">{`${student.fname} ${student.lname}`}</td>
        <td className="p-3">{student.username}</td>
        <td className="p-3 flex items-center space-x-2">
          <span
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
        <td className="p-3 text-center">
          <button onClick={() => onEdit(student)}>
            <Pencil className="text-blue-600 hover:text-blue-800" />
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="ml-2 text-red-600 hover:text-red-800"
          >
            <Trash2 />
          </button>
          <button
            onClick={handleGenerateQR}
            className="ml-2 text-green-600 hover:text-green-800"
          >
            {loadingQR ? "..." : "QR"}
          </button>
        </td>
      </tr>

      {showDeleteModal && (
        <DeleteStudentModal
          studentName={`${student.fname} ${student.lname}`}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Existing QR Modal */}
      {showQRCode && (
        <div
          className="fixed inset-0 bg-black flex justify-center items-center z-50"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          <div className="relative bg-white p-6 rounded-lg shadow-lg text-center">
            <button
              onClick={() => setShowQRCode(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold mb-4">Scan QR to Login</h2>
            {qrUrl ? <ReactQRCode value={qrUrl} size={200} /> : <p>Generating...</p>}
          </div>
        </div>
      )}
    </>
  );
}

export default StudentRow;
