import React from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

function StudentRow({ student, togglePassword, onEdit }) {
  return (
    <tr key={student.studentID} className="border-b hover:bg-gray-50">
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
      <td className="p-3 text-center">
        <button onClick={() => onEdit(student)}>
          <Pencil className="text-blue-600 hover:text-blue-800" />
        </button>
        <button className="ml-2 text-red-600 hover:text-red-800">
          <Trash2 />
        </button>
      </td>
    </tr>
  );
}

export default StudentRow;
