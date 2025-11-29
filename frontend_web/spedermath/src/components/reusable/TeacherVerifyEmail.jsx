// src/pages/TeacherVerifyEmail.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function TeacherVerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Email from navigation state (fallback to empty string)
  const initialEmail = location.state?.email || "";
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !code.trim()) {
      setError("Please enter both email and verification code.");
      return;
    }

    try {
      setIsLoading(true);
      const resp = await fetch(`${API_BASE}/api/teachers/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const result = await resp.json().catch(() => null);

      if (!resp.ok || result?.error) {
        setError(result?.error || "Invalid or expired code.");
        return;
      }

      setSuccess(result?.message || "Email verified successfully!");
      // After a short delay, go to login
      setTimeout(() => {
        navigate("/teacher-login");
      }, 800);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <a
        href="/"
        className="p-5 text-3xl md:text-4xl font-bold text-black text-center md:text-left"
      >
        SpederMath
      </a>

      <div className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-gray-50 rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl md:text-3xl font-neucha text-center mb-2">
            Verify your email
          </h2>
          <p className="text-sm text-gray-700 text-center mb-4">
            We&apos;ve sent a 6-digit code to your email. Enter it below to
            activate your account.
          </p>

          {error && (
            <p className="text-red-500 text-sm text-center mb-3">{error}</p>
          )}
          {success && (
            <p className="text-green-600 text-sm text-center mb-3">
              {success}
            </p>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Verification Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="border px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 tracking-[0.35em] text-center"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 text-white font-semibold rounded-xl transition ${
                isLoading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <p className="text-xs text-center text-gray-500 mt-4">
            Didn&apos;t receive a code? Check your spam folder or ask the admin
            to resend it.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TeacherVerifyEmail;
