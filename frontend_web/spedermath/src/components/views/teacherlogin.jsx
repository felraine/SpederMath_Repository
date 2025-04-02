import React from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const goToRegister = () => {
    navigate("/register");
  };


  return (
    
    <>
    <div className="flex flex-col h-screen">
    <div className="flex items-start justify-start p-5 text-2xl font-bold text-black">
      SpederMath
    </div>

    <div className="flex justify-center items-center h-screen bg-white">
      <div className="w-3/4 h-4/5 bg-white rounded-lg flex">
        
        {/* Left Side - Image to be pasted */}
        <div className="w-1/2 flex items-center justify-center bg-gray-200 rounded-lg border">
        <img 
          src="login-image.png" 
          alt="Login Illustration" 
          className="w-150 h-124 object-fill object-cover rounded-lg "
        />
      </div>

        {/* Right Side - Login Form */}
        <div className="w-2/3 p-12 flex flex-col justify-center mb-6 ml-10">
          <h2 className="text-6xl font-bold mb-5 text-center mb-6 ml-12">Login</h2>
          <p className="text-black-600 mb-6 text-center mb-6 ml-12">Welcome back!</p>

          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 mb-6 ml-10"
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 mb-6 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 mb-6 ml-10"
          />

          <button 
            className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg 
            hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-6 ml-10"
            onClick={goToRegister}
          >
            Login
          </button>
          <p className="p-2 text-gray-600-sm text-center mt-4 mb-6 ml-10">
          Don't have an account?{" "}
          <a className="font-bold text-gray cursor-pointer hover:text-blue-600 " onClick={goToRegister}> Sign Up</a>
          </p>
        </div>
      </div>
    </div>
    </div>
  </>
  );
}

export default Login;
