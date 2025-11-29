import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleLoginButton from "../reusable/GoogleLoginButton";

/* ================ helpers (added) ================ */
async function readJsonSafe(response) {
  const ct = response.headers.get("content-type") || "";
  const raw = await response.text();
  if (!ct.includes("application/json")) {
    // Return a shape we can show in UI if backend sends HTML/text for 4xx
    return { error: raw?.slice(0, 300) || "Unexpected response." };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { error: "Invalid JSON response." };
  }
}
/* ================================================ */

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const handleLogin = async () => {
    setErrorMsg("");
    try {
      const response = await fetch(`${API_BASE}/api/teachers/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await readJsonSafe(response);

      if (response.ok) {
        const token = result.token || result.jwt || null;
        if (token) {
          localStorage.setItem("token", token);
          navigate("/teacher-dashboard");
        } else {
          setErrorMsg("Login failed: No token received.");
        }
        return;
      }

      // Not OK (403/401/etc.)
      const message =
        result.message ||
        result.error ||
        `Login failed (HTTP ${response.status}).`;
      setErrorMsg(message);
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Title */}
      <a href="/" className="p-5 text-3xl md:text-4xl font-bold text-black">
        SpederMath
      </a>

      {/* Main Container */}
      <div className="flex justify-center items-center flex-1 p-4">
        <div className="w-full max-w-6xl bg-white rounded-xl flex flex-col md:flex-row md:items-center overflow-hidden">
          
          {/* Left Side (Image) */}
          <div className="w-full md:w-1/2 flex justify-center items-center p-6 order-2 md:order-1">
            <img
              src="/login-image.png"
              alt="Login Illustration"
              className="rounded-xl border object-cover w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-full"
            />
          </div>

          {/* Right Side (Form) */}
          <div className="w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-10 py-8 order-1 md:order-2">
            <h2 className="text-[40px] sm:text-[50px] md:text-[60px] lg:text-[70px] font-neucha text-center leading-none mb-2">LOGIN</h2>
            <p className="text-sm font-semibold text-center mb-6">Welcome back!</p>

            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              {errorMsg && (
                <div className="text-red-500 text-sm text-center -mb-2">{errorMsg}</div>
              )}

              <button 
                type="button"
                className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition"
                onClick={handleLogin}
              >
                Login
              </button>
            </form>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-xs text-gray-500">or</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              <GoogleLoginButton/>
            </div>

            <p className="text-sm text-center mt-6 text-gray-700">
              Don't have an account?{" "}
              <span 
                className="font-semibold text-black hover:text-blue-600 cursor-pointer"
                onClick={() => navigate("/register")}
              >
                Sign Up
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
