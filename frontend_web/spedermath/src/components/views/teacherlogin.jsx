import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    try {
      //test server
      const response = await fetch("http://localhost:8080/api/teachers/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      //production servers
      /*const response = await fetch("https://52.220.207.155:8080/api/teachers/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });*/

      const result = await response.text();

      if (response.ok) {
        // Login successful
        localStorage.setItem("token", "dummy-token"); // store real token later
        navigate("/teacher-dashboard");
      } else {
        setErrorMsg(result);
      }
    } catch (error) {
      setErrorMsg("An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-start justify-start p-5 text-2xl font-bold text-black">
        SpederMath
      </div>

      <div className="flex justify-center items-center h-screen bg-white">
        <div className="w-3/4 h-4/5 bg-white rounded-lg flex">
          {/* Left Side */}
          <div className="w-1/2 flex items-center justify-center bg-gray-200 rounded-lg border">
            <img 
              src="login-image.png" 
              alt="Login Illustration" 
              className="w-150 h-124 object-fill object-cover rounded-lg"
            />
          </div>

          {/* Right Side */}
          <div className="w-2/3 p-12 flex flex-col justify-center mb-6 ml-10">
            <h2 className="text-6xl font-bold mb-5 text-center ml-12">Login</h2>
            <p className="text-black-600 mb-6 text-center ml-12">Welcome back!</p>

            <input 
              type="email" 
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 mb-6 ml-10"
            />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 mb-6 ml-10"
            />

            {errorMsg && (
              <div className="text-red-500 text-sm text-center mb-4 ml-10">{errorMsg}</div>
            )}

            <button 
              className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg 
              hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-6 ml-10"
              onClick={handleLogin}
            >
              Login
            </button>

            <p className="p-2 text-gray-600-sm text-center mt-4 mb-6 ml-10">
              Don't have an account?{" "}
              <span className="font-bold text-gray cursor-pointer hover:text-blue-600" onClick={() => navigate("/register")}>
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
