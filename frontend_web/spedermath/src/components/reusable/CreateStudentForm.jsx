import React from "react";
import { Plus } from "lucide-react";

function CreateStudentForm({ formData, handleInputChange, handleFileChange, handleFormSubmit, setShowForm, editingStudentID }) {
  return (
    <div className="fixed inset-0 flex justify-center items-center z-50">
      <div className="fixed inset-0 bg-black" style={{ background: "rgba(0, 0, 0, 0.3)" }} onClick={() => setShowForm(false)}></div>
      <div className="bg-white p-4 sm:p-6 rounded-md w-[calc(100vw-32px)] sm:w-96 relative z-10 max-h-[calc(100vh-40px)] overflow-auto box-border">
      <h3 className="text-lg sm:text-xl font-semibold mb-4">{editingStudentID ? "Edit Student" : "Create New Student"}</h3>
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4 flex justify-center">
            <label htmlFor="profilePicture" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex justify-center items-center cursor-pointer">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </label>
            <input type="file" id="profilePicture" name="profilePicture" onChange={handleFileChange} className="hidden" />
          </div>

          <div className="mb-4">
            <label htmlFor="fname" className="block text-base sm:text-sm font-medium text-gray-700">First Name</label>
            <input type="text" id="fname" name="fname" value={formData.fname} onChange={handleInputChange} className="border rounded-xl px-4 py-3 sm:py-2 w-full" required />
          </div>

          <div className="mb-4">
            <label htmlFor="lname" className="block text-base sm:text-sm font-medium text-gray-700">Last Name</label>
            <input type="text" id="lname" name="lname" value={formData.lname} onChange={handleInputChange} className="border rounded-xl px-4 py-3 sm:py-2 w-full" required />
          </div>

          <div className="mb-4">
            <label htmlFor="birthdate" className="block text-base sm:text-sm font-medium text-gray-700">Birthdate</label>
            <input type="date" id="birthdate" name="birthdate" value={formData.birthdate} onChange={handleInputChange} className="border rounded-xl px-4 py-3 sm:py-2 w-full" required />
          </div>

          <div className="mb-4">
            <label htmlFor="username" className="block text-base sm:text-sm font-medium text-gray-700">Username</label>
            <input type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} className="border rounded-xl px-4 py-3 sm:py-2 w-full" required />
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 px-4 py-3 rounded-md sm:px-0 sm:py-0 sm:rounded-none">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white w-full py-3 px-4 rounded-xl hover:bg-blue-800 sm:w-auto sm:px-4 sm:py-2">
              {editingStudentID ? "Update Student" : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateStudentForm;
