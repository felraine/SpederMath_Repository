import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [name, setName] = useState(""); // username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const goToLogin = () => navigate("/teacher-login");

  const validate = () => {
    const newErrors = {};
    if (!fname.trim()) newErrors.fname = "Please enter your first name.";
    if (!lname.trim()) newErrors.lname = "Please enter your last name.";
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
    setShowSuccess(false);
    setSuccessMsg("");

    if (!validate()) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/teachers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fname, lname, name, email, password }),
      });

      const resultText = await response.text();

      if (response.ok) {
        // Backend should return something like: "Verification code sent to your email!"
        setSuccessMsg(resultText || "Verification code sent to your email.");
        setShowSuccess(true);

        // Go to verify-email screen and pass email
        navigate("/teacher-verify", {
          state: { email },
        });
      } else {
        setServerError(resultText || "Registration failed.");
      }
    } catch (err) {
      console.error(err);
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative font-sans">
      {/* Header */}
      <a
        href="/"
        className="p-5 text-3xl md:text-4xl font-bold text-black text-center md:text-left"
      >
        SpederMath
      </a>

      {/* Main */}
      <div className="flex justify-center items-center flex-1 relative z-10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl flex flex-col md:flex-row overflow-hidden items-center">
          {/* Left - Image */}
          <div className="w-full md:w-1/2 flex justify-center p-6 bg-gray-50">
            <img
              src="/login-image.png"
              alt="Signup Illustration"
              className="rounded-xl border object-cover w-full h-auto max-w-xs sm:max-w-sm md:max-w-md"
            />
          </div>

          {/* Right - Form */}
          <div className="w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-10 py-8">
            <h2 className="text-[40px] sm:text-[55px] md:text-[70px] font-neucha text-center leading-none mb-2">
              SIGN UP
            </h2>
            <p className="text-sm font-semibold text-center mb-3">
              Create your account
            </p>

            {serverError && (
              <p className="text-red-500 text-sm text-center mb-3">
                {serverError}
              </p>
            )}

            {showSuccess && (
              <p className="text-green-600 text-sm text-center mb-3">
                {successMsg}
              </p>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {/* Name Fields Row */}
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                {/* First Name */}
                <div className="w-full sm:w-1/2">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={fname}
                    onChange={(e) => setFname(e.target.value)}
                    className={`border px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 ${
                      errors.fname
                        ? "border-red-400 ring-red-300"
                        : "focus:ring-blue-400"
                    }`}
                  />
                  {errors.fname && (
                    <p className="text-xs text-red-500 mt-1">{errors.fname}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="w-full sm:w-1/2">
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lname}
                    onChange={(e) => setLname(e.target.value)}
                    className={`border px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 ${
                      errors.lname
                        ? "border-red-400 ring-red-300"
                        : "focus:ring-blue-400"
                    }`}
                  />
                  {errors.lname && (
                    <p className="text-xs text-red-500 mt-1">{errors.lname}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                {/* Username */}
                <div className="w-full sm:w-1/2">
                  <input
                    type="text"
                    placeholder="Username"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`border px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 ${
                      errors.name
                        ? "border-red-400 ring-red-300"
                        : "focus:ring-blue-400"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="w-full sm:w-1/2">
                  <input
                    type="text"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`border px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 ${
                      errors.email
                        ? "border-red-400 ring-red-300"
                        : "focus:ring-blue-400"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                {/* Password */}
                <div className="w-full sm:w-1/2">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`border px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 ${
                      errors.password
                        ? "border-red-400 ring-red-300"
                        : "focus:ring-blue-400"
                    }`}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="w-full sm:w-1/2">
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`border px-4 py-3 w-full rounded-xl focus:outline-none focus:ring-2 ${
                      errors.confirmPassword
                        ? "border-red-400 ring-red-300"
                        : "focus:ring-blue-400"
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
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
        </div>
      </div>
    </div>
  );
}

export default Register;
