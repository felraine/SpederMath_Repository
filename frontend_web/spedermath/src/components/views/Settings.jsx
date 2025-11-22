import React, { useState, useEffect } from "react";
import axios from "axios";
import TeacherHeader from "../reusable/TeacherHeader";
import { useNavigate } from "react-router-dom";
import ResponseModal from "../modals/ResponseModal";
import AvatarModal from "../modals/AvatarModal";
import { Plus } from "lucide-react";

/* ---------- default avatars (from frontend public/) ---------- */
const PROFILE_PICS = [
  "/photos/profile_pictures/profile_man.png",
  "/photos/profile_pictures/profile_man2.png",
  "/photos/profile_pictures/profile_man3.png",
  "/photos/profile_pictures/profile_woman.png",
  "/photos/profile_pictures/profile_woman2.png",
  "/photos/profile_pictures/profile_woman3.png",
];

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const FALLBACK = "/photos/profile_pictures/profile_man.png";

/* ---------- helpers to convert to base64 ---------- */
async function urlToBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result); // data URL
    reader.readAsDataURL(blob);
  });
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result); // data URL
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [teacher, setTeacher] = useState({ id: "", name: "", email: "", fname: "", lname: "" });

  // avatar states
  const [photoUrl, setPhotoUrl] = useState("");        // backend URL to stream blob
  const [photoPreview, setPhotoPreview] = useState(""); // what the <img> shows in UI
  const [photoBase64, setPhotoBase64] = useState("");   // send only when changed
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

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

  // Fetch teacher info (and photo URL)
  useEffect(() => {
    const fetchTeacherInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/teacher-login");
          return;
        }

        const res = await axios.get(`${API_BASE}/api/teachers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data || {};
        setTeacher({
          id: data.id || "",
          name: data.name || "",
          email: data.email || "",
          fname: data.fname || "",
          lname: data.lname || "",
        });

        if (data.photoUrl) {
          const abs = `${API_BASE}${data.photoUrl}`;
          setPhotoUrl(abs);
          setPhotoPreview(`${abs}?t=${Date.now()}`);
        } else {
          setPhotoUrl("");
          setPhotoPreview(FALLBACK);
        }
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

  // Save updated info to DB (send photoBase64 only if avatarDirty)
  const handleSave = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/teacher-login");
        return;
      }

      const payload = {
        name: teacher.name,
        email: teacher.email,
        fname: teacher.fname,
        lname: teacher.lname,
      };
      if (avatarDirty && photoBase64) {
        payload.photoBase64 = photoBase64; // backend will decode and store to BLOB
      }

      const res = await axios.put(`${API_BASE}/api/teachers/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        setModalMessage("Profile updated successfully!");
        setIsError(false);
        // refresh preview from server after save (cache-bust)
        if (teacher.id) {
          const abs = `${API_BASE}/api/teachers/${teacher.id}/photo`;
          setPhotoUrl(abs);
          setPhotoPreview(`${abs}?t=${Date.now()}`);
        }
        setAvatarDirty(false);
        setPhotoBase64("");
        window.dispatchEvent(new CustomEvent("teacher:updated"));
      } else {
        setModalMessage("Failed to update profile!");
        setIsError(true);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setModalMessage(error.response?.data || "An error occurred while updating your profile.");
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
        `${API_BASE}/api/teachers/change-password`,
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

  // Upload avatar directly (used by modal "upload your own")
  const onUploadFromModal = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToBase64(file); // "data:image/png;base64,...."
    setPhotoPreview(dataUrl); // show immediately
    setPhotoBase64(dataUrl);
    setAvatarDirty(true);
    setShowAvatarModal(false);
  };

  // Pick one of the system avatars
  const onPickSystemAvatar = async (picUrl) => {
    const dataUrl = await urlToBase64(picUrl);
    setPhotoPreview(picUrl);  // preview can point to the asset
    setPhotoBase64(dataUrl);  // but send base64 to backend
    setAvatarDirty(true);
    setShowAvatarModal(false);
  };

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <main className="flex-1 flex flex-col">

        <section
          className="bg-white p-6 shadow-md rounded-md overflow-y-auto scrollbar-hide"
          style={{ height: "500px", maxHeight: "1000px", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-left flex-1">Settings</h3>
          </div>

        {/* Tabs */}
        <div className="ml-2 mt-5 mb-8 flex flex-col space-y-2">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`text-left w-fit cursor-pointer select-none transition ${
              activeTab === "profile"
                ? "font-bold text-black before:content-['>'] before:mr-1"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Profile
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("subscription")}
            className={`text-left w-fit cursor-pointer select-none transition ${
              activeTab === "subscription"
                ? "font-bold text-black before:content-['>'] before:mr-1"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Subscription
          </button>
        </div>

          {/* ====================== PROFILE CONTENT ====================== */}
          {activeTab === "profile" && (
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="relative mb-5" style={{ marginTop: "-120px" }}>
                <div className="w-[100px] h-[100px] rounded-full bg-gray-200 flex items-center justify-center shadow-md relative overflow-hidden border">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="avatar"
                      className="w-full h-full object-cover"
                      onError={() => setPhotoPreview(FALLBACK)}
                    />
                  ) : (
                    <span className="text-gray-500">No photo</span>
                  )}
                </div>

                {/* Floating + button to open avatar chooser */}
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg border-2 border-white"
                  title="Change Avatar"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>

                {/* Avatar chooser modal */}
                {showAvatarModal && (
                  <AvatarModal
                    choices={PROFILE_PICS}
                    onSelect={onPickSystemAvatar}
                    onUpload={onUploadFromModal}
                    onClose={() => setShowAvatarModal(false)}
                  />
                )}
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
                        onChange={(e) => setTeacher({ ...teacher, name: e.target.value })}
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
                        onChange={(e) => setTeacher({ ...teacher, email: e.target.value })}
                        placeholder="Enter email address"
                        className="w-72 border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-bold mb-1">First Name</label>
                      <input
                        type="text"
                        value={teacher.fname}
                        onChange={(e) => setTeacher({ ...teacher, fname: e.target.value })}
                        placeholder="Enter first name"
                        className="w-72 border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-bold mb-1">Last Name</label>
                      <input
                        type="text"
                        value={teacher.lname}
                        onChange={(e) => setTeacher({ ...teacher, lname: e.target.value })}
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

                {/* Change Password Section */}
                <div>
                  <h4 className="font-bold text-lg mb-5">Change Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-5 items-end">
                    <div>
                      <label className="block text-sm font-bold mb-1">Old Password</label>
                      <input
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        className="w-72 border border-gray-300 rounded-md px-2.5 py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-1">New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-72 border border-gray-300 rounded-md px-2.5 py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
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
              <h4 className="font-semibold text-lg mb-2">Subscription Settings</h4>
              <p>Here you can manage your subscription plan and billing information.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Settings;
