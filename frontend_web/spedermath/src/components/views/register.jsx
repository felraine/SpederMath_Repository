import React from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const goToLogin = () => {
    navigate("/teacher-login");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
  {/* Title */}
  <a href="/" className="p-5 text-3xl md:text-4xl font-bold text-black">
    SpederMath
  </a>

  {/* Main Section */}
  <div className="flex justify-center items-center flex-1 p-4">
    <div className="w-full max-w-6xl bg-white rounded-xl flex flex-col md:flex-row md:items-center overflow-hidden">
      
      {/* Left Side (Image) */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-6 order-2 md:order-1">
        <img
          src="/login-image.png"
          alt="Signup Illustration"
          className="rounded-xl border object-cover w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-full"
        />
      </div>

      {/* Right Side (Form) */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-10 py-8 order-1 md:order-2">
        <h2 className="text-[40px] sm:text-[50px] md:text-[60px] lg:text-[70px] font-neucha text-center leading-none mb-2">
          SIGN UP
        </h2>

        <p className="text-sm font-semibold text-center mb-6">
          Create your account
        </p>

        <form className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="email"
            placeholder="Email"
            className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            placeholder="Password"
            className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            className="border rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <button
            type="submit"
            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition"
          >
            Sign up
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
