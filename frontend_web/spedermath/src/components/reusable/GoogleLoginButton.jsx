// src/components/reusable/GoogleLoginButton.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const GOOGLE_CLIENT_ID = "87963182103-tpjdqce23jo4d5dp1uj6e90522520mnf.apps.googleusercontent.com";

export default function GoogleLoginButton() {
  const buttonRef = useRef(null);
  const [rendered, setRendered] = useState(false);
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    let tries = 0;
    const maxTries = 20;

    const interval = setInterval(() => {
      tries += 1;

      if (window.google && buttonRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              const res = await fetch(
                `${API_BASE}/api/teachers/google-login`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: response.credential }),
                }
              );

              const text = await res.text();

              if (!res.ok) {
                console.error("Google login failed:", res.status, text);
                return;
              }

              const data = text ? JSON.parse(text) : {};

              // data should be { message, token }
              if (data.token) {
                localStorage.setItem("token", data.token);
                console.log("Google login success, navigating…", data);

                // 👇 redirect teacher after successful login
                navigate("/teacher-dashboard");
              } else {
                console.error("No token in Google login response", data);
              }
            } catch (err) {
              console.error("Google login error:", err);
            }
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: 320,
        });

        setRendered(true);
        clearInterval(interval);
      }

      if (tries >= maxTries) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="flex justify-center">
      <div ref={buttonRef} />
      {!rendered && (
        <button
          type="button"
          className="w-full max-w-xs border border-gray-300 rounded-xl py-2 text-sm font-medium text-gray-700"
        >
          Continue with Google
        </button>
      )}
    </div>
  );
}
