import React from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const goToRegister = () => {
    navigate("/register");
  };

  return (
    <div>
      <h2>Login Page</h2>
      <button onClick={goToRegister}>Go to Register</button>
    </div>
  );
}

export default Login;
