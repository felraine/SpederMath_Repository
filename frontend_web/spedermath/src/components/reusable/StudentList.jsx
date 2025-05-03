import React from "react";

function StudentList({ students = [] }) {
  return (
    <section className="bg-white p-4 shadow-md rounded-md">
      <h3 className="font-bold px-6">
        Students <span className="text-gray-500"> {students.length}</span>
      </h3>
      {/* List of students */}
      <div className="mt-4 space-y-4 overflow-y-auto max-h-110 px-6">
        {students.length === 0 ? (
            <p className="text-gray-500">No students found.</p>
        ) : (
            students.map((student) => (
                <button
                key={student.id || student.studentId || student._id}
                className="flex flex-col items-center justify-center p-2 mt-2 rounded-md w-full hover:scale-105 space-y-2 border-2 border-gray-500 transition duration-200 ease-in-out shadow-md"
              >
                <img
                  src="/display-pic.png"
                  alt={`${student.fname} ${student.lname}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <span className="font-semibold text-center">
                  {student.fname} {student.lname}
                </span>
              </button>
            ))
        )}
        </div>
    </section>
  );
}

export default StudentList;
