import React from "react";

function StudentList({
  students = [],
  isLoading = false,
  onSelect = () => {},
}) {
  const skeletonArray = Array.from({ length: 6 });

  return (
    <section className="bg-white p-4 shadow-md rounded-md h-[485px] flex flex-col">
      <h3 className="font-bold px-6">
        Students{" "}
        {!isLoading && <span className="text-gray-500"> {students.length}</span>}
      </h3>

      <div
        className="flex-1 overflow-y-auto px-6 mt-2 space-y-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {isLoading ? (
          skeletonArray.map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center p-2 rounded-md w-full space-y-2 border-2 border-gray-300 animate-pulse"
            >
              <div className="w-16 h-16 rounded-full bg-gray-300" />
              <div className="h-4 w-24 bg-gray-300 rounded" />
            </div>
          ))
        ) : students.length === 0 ? (
          <p className="text-gray-500">No students found.</p>
        ) : (
          students.map((student) => (
            <button
              key={student.studentID}
              onClick={() => onSelect(student)} // opens modal via parent
              className="flex flex-col items-center justify-center p-2 rounded-md w-full hover:scale-105 space-y-2 transition duration-200 ease-in-out shadow-md border-2 border-gray-500"
              title={`${student.fname ?? ""} ${student.lname ?? ""}`}
            >
              <img
                src="/display-pic.png"
                alt={`${student.fname ?? ""} ${student.lname ?? ""}`}
                className="w-16 h-16 rounded-full object-cover"
              />
              <span className="font-semibold text-center">
                {(student.fname ?? "") + " " + (student.lname ?? "")}
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

export default StudentList;
