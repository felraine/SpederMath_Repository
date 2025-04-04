import React from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const goToLogin = () => {
    navigate("/teacher-login");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      
      <div className="w-full px-50 pt-8">
        <h1 className="text-xl font-bold text-black font-patrick-hand">
          spedermath
        </h1>
      </div>

      
      <div className="flex justify-center items-center flex-1">
        <div className="w-11/12 max-w-5xl bg-white rounded-xl flex overflow-hidden items-center">
          
          
          <div className="w-1/2 flex justify-center p-6">
            <img
              src="/login-image.png"
              alt="Signup Illustration"
              className="rounded-xl border object-cover w-full max-w-md"
            />
          </div>

          
          <div className="w-1/2 flex flex-col justify-center px-10">
            <h2 className="text-[70px] font-neucha text-center leading-none mb-2">
              SIGN UP
            </h2>

            <p className="text-sm font-semibold text-center mb-8">
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
