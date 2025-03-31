import React from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const goToLogin = () => {
    navigate("/login");
  };

  return (
    <div>
      <h2>Register Page</h2>
      <button onClick={goToLogin}>Go to Login</button>
    </div>
  );
}

export default Register;
