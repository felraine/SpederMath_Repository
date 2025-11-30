import React, { useState } from "react";
import StudentRow from "./StudentRow";
import StudentRowSkeleton from "./StudentRowSkeleton";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import ReactQRCode from "react-qr-code";
import axios from "axios";
import { X } from "lucide-react";
import DeleteStudentModal from "../modals/DeleteStudentModal";

function StudentRowMobile({ student, togglePassword, onEdit, onDelete }) {
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [loadingQR, setLoadingQR] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const handleGenerateQR = async () => {
    try {
      setLoadingQR(true);
      const res = await axios.post(`${API_BASE}/api/students/${student.studentID}/qr-token`);
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

  const handleDeleteConfirm = () => {
    onDelete(student.studentID);
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-2.5">
        {/* Row 1: Name */}
        <div className="font-semibold text-sm mb-2">{`${student.fname} ${student.lname}`}</div>

        {/* Row 2: Actions (always on separate line) */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => togglePassword(student.studentID)}
            aria-label={student.showPassword ? "Hide password" : "Show password"}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            {student.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={() => onEdit(student)}
            aria-label="Edit student"
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            <Pencil size={16} className="text-blue-600" />
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-red-600 hover:text-red-800 flex items-center justify-center"
            aria-label="Delete student"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={handleGenerateQR}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-green-600 hover:text-green-800 text-xs font-bold flex items-center justify-center w-9 h-9"
            aria-label="Generate QR"
          >
            {loadingQR ? "." : "QR"}
          </button>
        </div>

        {/* Row 3: Username */}
        <div className="text-xs text-gray-600 truncate">{student.username}</div>

        {/* Row 4: Date Created */}
        <div className="text-xs text-gray-500">
          {new Date(student.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
          })}
        </div>

        {/* Row 5: Password (if shown) */}
        {student.showPassword && (
          <div className="text-xs text-gray-700 mt-1.5 bg-gray-50 p-2 rounded">
            <span className="font-mono text-xs break-all">{student.password}</span>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <DeleteStudentModal
          studentName={`${student.fname} ${student.lname}`}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}

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

function StudentTable({ students, togglePassword, onEdit, onDelete, loading }) {
  const skeletonCount = 5;

  return (
    <div className="overflow-x-auto max-h-96">
      {/* Desktop / Tablet: show table from sm and up */}
      <div className="hidden sm:block">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-white font-semibold sticky top-0 z-10 shadow">
            <tr>
              <th className="p-3">Student Name</th>
              <th className="p-3">Username</th>
              <th className="p-3">Password</th>
              <th className="p-3">Date Created</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(skeletonCount)].map((_, i) => <StudentRowSkeleton key={i} />)
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-5 text-center text-gray-500">
                  No students added
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <StudentRow
                  key={student.studentID}
                  student={student}
                  togglePassword={togglePassword}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked card/list view for portrait & landscape phones */}
      <div className="sm:hidden px-2">
        {loading ? (
          [...Array(skeletonCount)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-2.5 mb-2.5 animate-pulse">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="h-4 bg-gray-300 rounded w-32 flex-1" />
                <div className="flex gap-1">
                  <div className="w-7 h-7 rounded bg-gray-300" />
                  <div className="w-7 h-7 rounded bg-gray-300" />
                  <div className="w-7 h-7 rounded bg-gray-300" />
                  <div className="w-7 h-7 rounded bg-gray-300" />
                </div>
              </div>
              <div className="h-2.5 bg-gray-300 rounded w-24 mb-1" />
              <div className="h-2.5 bg-gray-300 rounded w-20" />
            </div>
          ))
        ) : students.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No students added</div>
        ) : (
          <div className="space-y-2.5">
            {students.map((student) => (
              <StudentRowMobile
                key={student.studentID}
                student={student}
                togglePassword={togglePassword}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentTable;
