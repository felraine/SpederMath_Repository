import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/teachers/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }), // Assuming email and password are being correctly handled
      });
  
      const result = await response.json();
  
      if (response.ok) {
        if (result.token) {
          // Store the token in localStorage if it's available in the response
          localStorage.setItem("token", result.token);
          navigate("/teacher-dashboard"); // Redirect to the teacher dashboard
        } else {
          setErrorMsg("Login failed: No token received.");
        }
      } else {
        setErrorMsg(result.message || "Login failed: Unknown error.");
      }
    } catch (error) {
      console.error("Login error:", error); // Log the error for debugging purposes
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

            <form className="flex flex-col gap-4">
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
