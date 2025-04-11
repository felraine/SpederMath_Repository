import React from "react";
import StudentRow from "./StudentRow";

function StudentTable({ students, togglePassword, onEdit }) {
  return (
    <div className="overflow-x-auto max-h-96">
      <table className="min-w-full table-auto text-sm text-left">
        <thead className="bg-gray-100 font-semibold sticky top-0">
          <tr>
            <th className="p-3">Student Name</th>
            <th className="p-3">Username</th>
            <th className="p-3">Password</th>
            <th className="p-3">Date Created</th>
            <th className="p-3">Level</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <StudentRow
            key={student.studentID}
            student={student}
            togglePassword={togglePassword}
            onEdit={onEdit}
            />          
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentTable;
