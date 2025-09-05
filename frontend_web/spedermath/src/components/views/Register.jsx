import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const goToLogin = () => navigate("/teacher-login");

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Please enter your username.";
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email.";
    }
    if (!password) newErrors.password = "Password is required.";
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8080/api/teachers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.text();

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigate("/teacher-login");
        }, 500);
      } else {
        setServerError(result);
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative font-sans">
      {/* Header */}
      <div className="flex items-start justify-start p-5 text-2xl font-bold text-black">
        SpederMath
      </div>

      {/* Main */}
      <div className="flex justify-center items-center flex-1 relative z-10">
        <div className="w-11/12 max-w-5xl bg-white rounded-xl flex overflow-hidden items-center">
          {/* Left - Image */}
          <div className="w-1/2 flex justify-center p-6">
            <img
              src="/login-image.png"
              alt="Signup Illustration"
              className="rounded-xl border object-cover w-full max-w-md"
            />
          </div>

          {/* Right - Form */}
          <div className="w-1/2 flex flex-col justify-center px-10">
            <h2 className="text-[70px] font-neucha text-center leading-none mb-2">
              SIGN UP
            </h2>
            <p className="text-sm font-semibold text-center mb-6">
              Create your account
            </p>

            {serverError && (
              <p className="text-red-500 text-sm text-center mb-4">{serverError}</p>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {/* Username */}
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`border px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 ${
                    errors.name ? "border-red-400 ring-red-300" : "focus:ring-blue-400"
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <input
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`border px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 ${
                    errors.email ? "border-red-400 ring-red-300" : "focus:ring-blue-400"
                  }`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`border px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 ${
                    errors.password ? "border-red-400 ring-red-300" : "focus:ring-blue-400"
                  }`}
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`border px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 ${
                    errors.confirmPassword ? "border-red-400 ring-red-300" : "focus:ring-blue-400"
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 text-white font-semibold rounded-xl transition ${
                  isLoading
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isLoading ? "Registering..." : "Sign up"}
              </button>
            </form>

            <p className="text-sm text-center mt-6 text-gray-700">
              Already have an account?{" "}
              <span
                className="font-semibold text-black hover:text-blue-600 cursor-pointer"
                onClick={goToLogin}
              >
                Sign in
              </span>
            </p>
          </div>

          {/* Success Popup */}
          {/*
          {showSuccess && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
              <div className="bg-[#EEF2FF] border border-indigo-300 rounded-3xl shadow-2xl px-10 py-8 w-[90%] max-w-sm text-center animate-fade-in-up">
                <div className="text-5xl mb-2">🎉</div>
                <h3 className="text-2xl font-neucha text-indigo-700 mb-2">
                  You're in!
                </h3>
                <p className="text-sm text-gray-800 mb-6">
                  You’ve successfully registered. Redirecting to login...
                </p>
                <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 animate-slide-progress"></div>
                </div>
              </div>
            </div>
          )}
          */}

          {/* Tailwind Animations */}
          {/*
          <style>
            {`
              @keyframes slide-progress {
                0% { width: 0%; }
                100% { width: 100%; }
              }
              .animate-slide-progress {
                animation: slide-progress 3.5s linear forwards;
              }
              @keyframes fade-in-up {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .animate-fade-in-up {
                animation: fade-in-up 0.4s ease-out;
              }
            `}
          </style>
          */}
        </div>
      </div>
    </div>
  );
}

export default Register;
