import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Pencil, Trash2, Plus } from "lucide-react"; // Lucide icons
import axios from "axios";

function ManageStudent() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    birthdate: "",
    username: "",
    profilePicture: null,
  });

  const [showForm, setShowForm] = useState(false);

  // Fetch students from the API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/students/all");
        // Initialize showPassword in students state
        setStudents(response.data.map(student => ({ ...student, showPassword: false })));
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/teacher-login");
  };

  const togglePassword = (studentID) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.studentID === studentID ? { ...s, showPassword: !s.showPassword } : s
      )
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file change (for profile picture)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({
      ...prev,
      profilePicture: file,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append("fname", formData.fname);  // Corrected field name
    form.append("lname", formData.lname);  
    form.append("username", formData.username);
    form.append("birthdate", formData.birthdate);

    if (formData.profilePicture) {
      form.append("profilePicture", formData.profilePicture);
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/api/students", // Replace with your actual API URL
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setStudents((prevStudents) => [...prevStudents, response.data]); // Add new student to state
      setShowForm(false); // Hide form after successful submission
      setFormData({
        fname: "",  // Corrected field name
        lname: "",  
        birthdate: "",
        username: "",
        profilePicture: null,
      }); // Reset form
    } catch (error) {
      console.error("Error creating student:", error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white p-5 shadow-md">
        <h2 className="text-xl font-bold">spedermath</h2>
        <nav className="mt-5">
          <ul>
            <li
              className="p-3 hover:bg-gray-300 rounded-md cursor-pointer"
              onClick={() => navigate("/teacher-dashboard")}
            >
              Dashboard
            </li>
            <li className="p-3 bg-gray-800 text-white rounded-md">
              Manage Students
            </li>
            <li className="p-3 hover:bg-gray-300 rounded-md">Settings</li>
            <li
              className="p-3 hover:bg-gray-300 rounded-md cursor-pointer"
              onClick={handleLogout}
            >
              Logout
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center bg-white p-4 shadow-md rounded-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            <div>
              <h3 className="font-semibold">Teacher Leilah Garcia</h3>
              <p className="text-sm text-gray-500">Hello! Welcome back!</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Premium Plan</p>
        </header>

        {/* Student Table */}
        <section className="bg-white p-4 shadow-md rounded-md mt-6 overflow-x-auto">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Student List</h3>
              <input
                type="text"
                placeholder="Search for students..."
                className="border rounded-xl px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-800"
              onClick={() => setShowForm(true)} // Show form on button click
            >
              + Create New Student
            </button>
          </div>

          {/* Modal for Creating New Student */}
          {showForm && (
            <div className="fixed inset-0 flex justify-center items-center z-50">
              {/* background container */}
              <div
                className="fixed inset-0 bg-black"
                style={{ background: "rgba(0, 0, 0, 0.3)" }}
                onClick={() => setShowForm(false)}
              ></div>

              {/* Modal Form Container */}
              <div className="bg-white p-6 rounded-md w-96 relative z-10">
                <h3 className="text-xl font-semibold mb-4">Create New Student</h3>
                <form onSubmit={handleFormSubmit}>
                  {/* Profile Picture Section */}
                  <div className="mb-4 flex justify-center">
                    <label
                      htmlFor="profilePicture"
                      className="w-16 h-16 rounded-full bg-gray-200 flex justify-center items-center cursor-pointer"
                    >
                      <Plus size={24} className="text-gray-600" />
                    </label>
                    <input
                      type="file"
                      id="profilePicture"
                      name="profilePicture"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="fname" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="fname"
                      name="fname"
                      value={formData.fname}
                      onChange={handleInputChange}
                      className="border rounded-xl px-4 py-2 w-full"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="lname" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lname"
                      name="lname"
                      value={formData.lname}
                      onChange={handleInputChange}
                      className="border rounded-xl px-4 py-2 w-full"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
                      Birthdate
                    </label>
                    <input
                      type="date"
                      id="birthdate"
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleInputChange}
                      className="border rounded-xl px-4 py-2 w-full"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="border rounded-xl px-4 py-2 w-full"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-800"
                    >
                      Create Student
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <table className="min-w-full table-auto text-sm text-left">
            <thead className="bg-gray-100 font-semibold">
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
                <tr key={student.studentID} className="border-b hover:bg-gray-50">
                  <td className="p-3">{`${student.fname} ${student.lname}`}</td>
                  <td className="p-3">{student.username}</td>
                  <td className="p-3 flex items-center space-x-2">
                    <span
                        className="password-display"
                        style={{
                        minWidth: '70px',  // Fixed width so the table won't expand
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        }}
                    >
                        {student.showPassword ? student.password : "********"}
                    </span>
                    <button onClick={() => togglePassword(student.studentID)}>
                        {student.showPassword ? <EyeOff /> : <Eye />}
                    </button>
                    </td>
                  <td className="p-3">{student.formattedCreatedAt}</td>
                  <td className="p-3">{student.level}</td>
                  <td className="p-3 text-center">
                    <button className="text-yellow-600 hover:text-yellow-800">
                      <Pencil />
                    </button>
                    <button className="ml-2 text-red-600 hover:text-red-800">
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default ManageStudent;
