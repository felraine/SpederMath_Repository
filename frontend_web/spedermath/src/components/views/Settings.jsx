import React, { useState, useEffect } from "react";
import axios from "axios";
import TeacherHeader from "../reusable/TeacherHeader";
import { useNavigate } from "react-router-dom";
import ResponseModal from "../modals/ResponseModal";

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [teacher, setTeacher] = useState({ name: "", email: "", fname: "", lname: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Fetch teacher info
  useEffect(() => {
    const fetchTeacherInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/teacher-login");
          return;
        }

        const res = await axios.get("http://localhost:8080/api/teachers/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTeacher({
          name: res.data.name || "",
          email: res.data.email || "",
          fname: res.data.fname || "",
          lname: res.data.lname || "",
        });
      } catch (error) {
        console.error("Error fetching teacher info:", error);
        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/teacher-login");
        }
      }
    };

    fetchTeacherInfo();
  }, [navigate]);

  // Save updated info to DB
  const handleSave = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/teacher-login");
        return;
      }

      const res = await axios.put(
        "http://localhost:8080/api/teachers/me",
        {
          name: teacher.name,
          email: teacher.email,
          fname: teacher.fname,
          lname: teacher.lname,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200) {
        setModalMessage("Profile updated successfully!");
        setIsError(false);
      } else {
        setModalMessage("Failed to update profile!");
        setIsError(true);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setModalMessage("An error occurred while updating your profile.");
      setIsError(true);
    } finally {
      setIsLoading(false);
      setShowModal(true);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setModalMessage("Please fill out all fields.");
      setIsError(true);
      setShowModal(true);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setModalMessage("New password and confirm password do not match.");
      setIsError(true);
      setShowModal(true);
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/teacher-login");
        return;
      }

      const response = await axios.put(
        "http://localhost:8080/api/teachers/change-password",
        passwordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setModalMessage(response.data || "Password changed successfully!");
      setIsError(false);
      setShowModal(true);

      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error changing password:", error);
      setModalMessage(error.response?.data || "Error changing password. Please try again.");
      setIsError(true);
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col">
        <TeacherHeader />

        <section
            className="bg-white p-6 shadow-md rounded-md mt-6 overflow-y-auto scrollbar-hide"
            style={{
              height: "500px",
              maxHeight: "1000px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-left flex-1">Settings</h3>
          </div>

          {/* Tabs */}
          <div className="ml-2 mt-5 mb-8 relative">
            <p
              onClick={() => setActiveTab("profile")}
              className={`cursor-pointer mb-2 ${
                activeTab === "profile"
                  ? "font-bold text-black before:content-['>'] before:mr-1"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Profile
            </p>

            <p
              onClick={() => setActiveTab("subscription")}
              className={`cursor-pointer ${
                activeTab === "subscription"
                  ? "font-bold text-black before:content-['>'] before:mr-1"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Subscription
            </p>
          </div>

          {/* ====================== PROFILE CONTENT ====================== */}
          {activeTab === "profile" && (
            <div className="flex flex-col items-center">
              <div className="relative mb-5" style={{ marginTop: "-120px" }}>
                <div className="w-25 h-25 rounded-full bg-gray-300 flex items-center justify-center shadow-md relative">
                  <span className="absolute -bottom-1 -right-1 bg-gray-300 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg font-light shadow-sm cursor-pointer border border-white">
                    +
                  </span>
                </div>
              </div>

              {/* Form Area */}
              <div className="w-full max-w-3xl ml-30 space-y-10">
                {/* Personal Information Section */}
                <div>
                  <h4 className="font-bold text-lg mb-5">Personal Information</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-5 items-end">
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-bold mb-1">Username</label>
                      <input
                        type="text"
                        value={teacher.name}
                        onChange={(e) =>
                          setTeacher({ ...teacher, name: e.target.value })
                        }
                        placeholder="Enter username"
                        className="w-72 border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-bold mb-1">Email Address</label>
                      <input
                        type="text"
                        value={teacher.email}
                        onChange={(e) =>
                          setTeacher({ ...teacher, email: e.target.value })
                        }
                        placeholder="Enter email address"
                        className="w-72 border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    {/* First Name - now editable */}
                    <div>
                      <label className="block text-sm font-bold mb-1">First Name</label>
                      <input
                        type="text"
                        value={teacher.fname}
                        onChange={(e) =>
                          setTeacher({ ...teacher, fname: e.target.value })
                        }
                        placeholder="Enter first name"
                        className="w-72 border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    {/* Last Name - now editable */}
                    <div>
                      <label className="block text-sm font-bold mb-1">Last Name</label>
                      <input
                        type="text"
                        value={teacher.lname}
                        onChange={(e) =>
                          setTeacher({ ...teacher, lname: e.target.value })
                        }
                        placeholder="Enter last name"
                        className="w-72 border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    <div></div>

                    {/* Save Changes */}
                    <div className="flex justify-end md:justify-start mt-2">
                      <button
                        onClick={handleSave}
                        className="w-72 bg-[#1C90F3] text-white px-5 py-1.5 rounded-full hover:bg-[#137de5] transition"
                      >
                        Save Changes
                      </button>

                      {showModal && (
                        <ResponseModal
                          message={modalMessage}
                          isError={isError}
                          onClose={() => setShowModal(false)}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Change Password Section */}
                <div>
                  <h4 className="font-bold text-lg mb-5">Change Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-5 items-end">
                    <div>
                      <label className="block text-sm font-bold mb-1">
                        Old Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            oldPassword: e.target.value,
                          })
                        }
                        className="w-72 border border-gray-300 rounded-md px-2.5 py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-72 border border-gray-300 rounded-md px-2.5 py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-72 border border-gray-300 rounded-md px-2.5 py-1.5"
                      />
                    </div>

                    <div className="flex justify-end md:justify-start mt-2">
                      <button
                        onClick={handleChangePassword}
                        className="w-72 bg-[#1C90F3] text-white px-5 py-1.5 rounded-full hover:bg-[#137de5] transition"
                      >
                        {isLoading ? "Saving..." : "Save Changes"}
                      </button>

                      {showModal && (
                        <ResponseModal
                          message={modalMessage}
                          isError={isError}
                          onClose={() => setShowModal(false)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====================== SUBSCRIPTION CONTENT ====================== */}
          {activeTab === "subscription" && (
            <div className="text-gray-700 mt-10 ml-4">
              <h4 className="font-semibold text-lg mb-2">
                Subscription Settings
              </h4>
              <p>
                Here you can manage your subscription plan and billing information.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Settings;
