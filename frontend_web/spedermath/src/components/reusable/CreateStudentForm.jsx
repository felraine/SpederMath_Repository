import React from "react";
import { Plus } from "lucide-react";

function CreateStudentForm({ formData, handleInputChange, handleFileChange, handleFormSubmit, setShowForm, editingStudentID }) {
  return (
    <div className="fixed inset-0 flex justify-center items-center z-50">
      <div className="fixed inset-0 bg-black" style={{ background: "rgba(0, 0, 0, 0.3)" }} onClick={() => setShowForm(false)}></div>
      <div className="bg-white p-6 rounded-md w-96 relative z-10">
      <h3 className="text-xl font-semibold mb-4">{editingStudentID ? "Edit Student" : "Create New Student"}</h3>
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4 flex justify-center">
            <label htmlFor="profilePicture" className="w-16 h-16 rounded-full bg-gray-200 flex justify-center items-center cursor-pointer">
              <Plus size={24} className="text-gray-600" />
            </label>
            <input type="file" id="profilePicture" name="profilePicture" onChange={handleFileChange} className="hidden" />
          </div>

          <div className="mb-4">
            <label htmlFor="fname" className="block text-sm font-medium text-gray-700">First Name</label>
            <input type="text" id="fname" name="fname" value={formData.fname} onChange={handleInputChange} className="border rounded-xl px-4 py-2 w-full" required />
          </div>

          <div className="mb-4">
            <label htmlFor="lname" className="block text-sm font-medium text-gray-700">Last Name</label>
            <input type="text" id="lname" name="lname" value={formData.lname} onChange={handleInputChange} className="border rounded-xl px-4 py-2 w-full" required />
          </div>

          <div className="mb-4">
            <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">Birthdate</label>
            <input type="date" id="birthdate" name="birthdate" value={formData.birthdate} onChange={handleInputChange} className="border rounded-xl px-4 py-2 w-full" required />
          </div>

          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} className="border rounded-xl px-4 py-2 w-full" required />
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-800">
              {editingStudentID ? "Update Student" : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateStudentForm;
