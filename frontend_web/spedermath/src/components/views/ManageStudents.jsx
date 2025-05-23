import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../reusable/Sidebar";
import StudentTable from "../reusable/StudentTable";
import CreateStudentForm from "../reusable/CreateStudentForm";
import axios from "axios";
import TeacherHeader from "../reusable/TeacherHeader";

function ManageStudent() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({ fname: "", lname: "", birthdate: "", username: "", profilePicture: null });
  const [showForm, setShowForm] = useState(false);
  const [editingStudentID, setEditingStudentID] = useState(null);


  // Fetch students from the API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Token:", token);

        if (!token) {
          console.error("No token found, user is not authenticated.");
          navigate("/teacher-login");
          return;
        }

        const response = await axios.get("http://localhost:8080/api/students/all", {
          headers: { "Authorization": `Bearer ${token}` },
        });
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
      prev.map((s) => (s.studentID === studentID ? { ...s, showPassword: !s.showPassword } : s))
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, profilePicture: file }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
  
    const form = new FormData();
    form.append("fname", formData.fname);
    form.append("lname", formData.lname);
    form.append("username", formData.username);
    form.append("birthdate", formData.birthdate);
  
    if (formData.profilePicture) {
      form.append("profilePicture", formData.profilePicture);
    }

    if (formData.level != null) {
      form.append("level", formData.level);
    }
  
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${token}`,
      };
  
      let response;
      if (editingStudentID) {
        response = await axios.put(`http://localhost:8080/api/students/${editingStudentID}`, form, { headers });
        setStudents(prev => prev.map(s => s.studentID === editingStudentID ? { ...response.data, showPassword: false } : s));
      } else {
        response = await axios.post("http://localhost:8080/api/students/create", form, { headers });
        setStudents(prev => [...prev, { ...response.data, showPassword: false }]);
      }
  
      setShowForm(false);
      setFormData({ fname: "", lname: "", birthdate: "", username: "", profilePicture: null });
      setEditingStudentID(null);
    } catch (error) {
      console.error("Error submitting student form:", error);
    }
  };

  console.log("token", localStorage.getItem("token"));
  
  const handleEdit = (student) => {
    setFormData({
      fname: student.fname,
      lname: student.lname,
      birthdate: student.birthdate,
      username: student.username,
      profilePicture: null,
      studentID: student.studentID, 
      level: student.level,
    });
    setEditingStudentID(student.studentID);
    setShowForm(true);
  };  

  const handleDelete = async (studentID) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
      };

      await axios.delete(`http://localhost:8080/api/students/${studentID}`, { headers });

      setStudents(students.filter((student) => student.studentID !== studentID));
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-200">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 flex flex-col">
      <TeacherHeader/>
        <section className="bg-white p-4 shadow-md rounded-md mt-6 overflow-x-auto" style={{ height: "500px", maxHeight: '1000px' }}>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Student List</h3>
              <input
                type="text"
                placeholder="Search for students..."
                className="border rounded-xl px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-800" onClick={() => setShowForm(true)}>
              + Create New Student
            </button>
          </div>

          {showForm && <CreateStudentForm formData={formData} handleInputChange={handleInputChange} handleFileChange={handleFileChange} handleFormSubmit={handleFormSubmit} setShowForm={setShowForm} editingStudentID={editingStudentID}/>}

          <StudentTable
          students={students}
          togglePassword={togglePassword}
          onEdit={handleEdit}
          onDelete={handleDelete}
          />
        </section>
      </main>
    </div>
  );
}

export default ManageStudent;
