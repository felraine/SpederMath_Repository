import React from "react";

function StudentRowSkeleton() {
  return (
    <tr className="border-b animate-pulse">
      {/* Student Name */}
      <td className="p-3">
        <div className="bg-gray-300 rounded h-4 w-32"></div>
      </td>

      {/* Username */}
      <td className="p-3">
        <div className="bg-gray-300 rounded h-4 w-24"></div>
      </td>

      {/* Password (with icon space) */}
      <td className="p-3 flex items-center space-x-2">
        <div className="bg-gray-300 rounded h-4 w-20"></div>
        <div className="bg-gray-300 rounded h-5 w-5"></div> {/* icon placeholder */}
      </td>

      {/* Date Created */}
      <td className="p-3">
        <div className="bg-gray-300 rounded h-4 w-28"></div>
      </td>

      {/* Actions (buttons icons placeholders) */}
      <td className="p-3 text-center flex justify-center space-x-3">
        <div className="bg-gray-300 rounded h-5 w-5"></div>
        <div className="bg-gray-300 rounded h-5 w-5"></div>
        <div className="bg-gray-300 rounded h-5 w-5"></div>
      </td>
    </tr>
  );
}

export default StudentRowSkeleton;
