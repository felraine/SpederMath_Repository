import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ResponseModal from "../modals/ResponseModal";
import AvatarModal from "../modals/AvatarModal";
import { Plus } from "lucide-react";

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

async function urlToBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [teacher, setTeacher] = useState({ id: "", name: "", email: "", fname: "", lname: "" });

  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoBase64, setPhotoBase64] = useState("");
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
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

  useEffect(() => {
    const fetchTeacherInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/teacher-login");

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
          setPhotoPreview(FALLBACK);
        }
      } catch (error) {
        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/teacher-login");
        }
      } finally {
        setProfileLoaded(true);
      }
    };
    fetchTeacherInfo();
  }, [navigate]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return navigate("/teacher-login");

      const payload = {
        name: teacher.name,
        email: teacher.email,
        fname: teacher.fname,
        lname: teacher.lname,
      };
      if (avatarDirty && photoBase64) payload.photoBase64 = photoBase64;

      await axios.put(`${API_BASE}/api/teachers/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setModalMessage("Profile updated successfully!");
      setIsError(false);
      if (teacher.id) {
        setPhotoPreview(`${API_BASE}/api/teachers/${teacher.id}/photo?t=${Date.now()}`);
      }
      setAvatarDirty(false);
      setPhotoBase64("");
      window.dispatchEvent(new CustomEvent("teacher:updated"));
    } catch (error) {
      setModalMessage(error.response?.data || "Failed to update profile.");
      setIsError(true);
    } finally {
      setIsLoading(false);
      setShowModal(true);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setModalMessage("Please fill all fields."); setIsError(true); setShowModal(true); return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setModalMessage("Passwords do not match."); setIsError(true); setShowModal(true); return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE}/api/teachers/change-password`, passwordData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModalMessage("Password changed successfully!");
      setIsError(false);
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setModalMessage(error.response?.data || "Error changing password.");
      setIsError(true);
    } finally {
      setIsLoading(false);
      setShowModal(true);
    }
  };

  const onUploadFromModal = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToBase64(file);
    setPhotoPreview(dataUrl);
    setPhotoBase64(dataUrl);
    setAvatarDirty(true);
    setShowAvatarModal(false);
  };

  const onPickSystemAvatar = async (picUrl) => {
    const dataUrl = await urlToBase64(picUrl);
    setPhotoPreview(picUrl);
    setPhotoBase64(dataUrl);
    setAvatarDirty(true);
    setShowAvatarModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative">

          {/* ====== MOBILE: Fixed Profile Picture + Top Tabs ====== */}
          <div className="sm:hidden">
            {/* Profile Picture - Fixed at top, overlapping content */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
              <div className="relative">
                { !profileLoaded ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gray-100" />
                ) : (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gray-200">
                    <img
                      src={photoPreview || FALLBACK}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={() => setPhotoPreview(FALLBACK)}
                    />
                  </div>
                )}
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-4 border-white"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Mobile Top Tabs */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pt-4">
              <div className="flex justify-center gap-12 pb-4">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-6 py-2 text-sm font-bold relative transition-all ${
                    activeTab === "profile"
                      ? "text-indigo-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-indigo-600"
                      : "text-gray-500"
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("subscription")}
                  className={`px-6 py-2 text-sm font-bold relative transition-all ${
                    activeTab === "subscription"
                      ? "text-indigo-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-indigo-600"
                      : "text-gray-500"
                  }`}
                >
                  Subscription
                </button>
              </div>
            </div>
          </div>

          {/* ====== DESKTOP/TABLET: Original Tabs + Avatar ====== */}
          <div className="hidden sm:block border-b border-gray-200">
            <div className="flex gap-10 px-6 py-5">
              <button
                onClick={() => setActiveTab("profile")}
                className={`text-lg font-medium transition ${activeTab === "profile" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-600 hover:text-black"}`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab("subscription")}
                className={`text-lg font-medium transition ${activeTab === "subscription" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-600 hover:text-black"}`}
              >
                Subscription
              </button>
            </div>
          </div>

          {/* ====== CONTENT (with padding for mobile avatar) ====== */}
          <div className="pt-28 sm:pt-8 p-5 sm:p-8">

            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <>
                {/* Desktop Avatar (hidden on mobile) */}
                <div className="hidden sm:flex sm:justify-center sm:-mt-16">
                  <div className="relative">
                      { !profileLoaded ? (
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gray-100" />
                      ) : (
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gray-200">
                          <img
                            src={photoPreview || FALLBACK}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={() => setPhotoPreview(FALLBACK)}
                          />
                        </div>
                      )}
                    <button
                      onClick={() => setShowAvatarModal(true)}
                      className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-4 border-white"
                    >
                      <Plus size={20} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                {showAvatarModal && (
                  <AvatarModal
                    choices={PROFILE_PICS}
                    onSelect={onPickSystemAvatar}
                    onUpload={onUploadFromModal}
                    onClose={() => setShowAvatarModal(false)}
                  />
                )}

                <div className="space-y-10 mt-8 sm:mt-12">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 text-center sm:text-left">Personal Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                      {[
                        { label: "Username", key: "name" },
                        { label: "Email Address", key: "email" },
                        { label: "First Name", key: "fname" },
                        { label: "Last Name", key: "lname" },
                      ].map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                          <input
                            type="text"
                            value={teacher[field.key]}
                            onChange={(e) => setTeacher({ ...teacher, [field.key]: e.target.value })}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center sm:justify-end mt-6">
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-12 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition text-sm"
                      >
                        {isLoading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-8">
                    <h4 className="text-lg font-bold text-gray-800 text-center sm:text-left">Change Password</h4>
                    <div className="grid grid-cols-1 gap-5 mt-6">
                      {["oldPassword", "newPassword", "confirmPassword"].map((key) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {key === "oldPassword" ? "Current Password" : key === "newPassword" ? "New Password" : "Confirm New Password"}
                          </label>
                          <input
                            type="password"
                            value={passwordData[key]}
                            onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center sm:justify-end mt-6">
                      <button
                        onClick={handleChangePassword}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-12 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition text-sm"
                      >
                        {isLoading ? "Changing..." : "Change Password"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SUBSCRIPTION TAB */}
            {activeTab === "subscription" && (
              <div className="text-center py-20">
                <h4 className="text-xl font-bold text-gray-800 mb-4">Subscription Settings</h4>
                <p className="text-gray-600">Manage your plan and billing information here.</p>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <ResponseModal message={modalMessage} isError={isError} onClose={() => setShowModal(false)} />
        )}
      </main>
    </div>
  );
}

export default Settings;