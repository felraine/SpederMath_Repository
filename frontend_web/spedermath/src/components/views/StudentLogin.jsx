import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [autoLogging, setAutoLogging] = useState(false); // <-- added
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (user = username, pass = password) => {
    try {
      const response = await fetch("http://localhost:8080/api/students/student-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });

      const result = await response.json();

      if (response.ok && result.token) {
        localStorage.setItem("token", result.token);
        // Optional convenience keys (if your app uses them):
        localStorage.setItem("student_username", user);
        navigate("/student-dashboard");
      } else {
        setErrorMsg(result.message || "Login failed: Invalid username or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("An error occurred. Please try again.");
    }
  };

  // NEW: QR token flow (auto-login)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");      // from /public/qr-login?token=...
    const urlUsername = params.get("username");
    const urlPassword = params.get("password");

    // 1) If a QR token is present, exchange it and auto-login
    if (urlToken) {
      (async () => {
        try {
          setAutoLogging(true);
          setErrorMsg("");
          const res = await fetch(
            `http://localhost:8080/public/qr-exchange?token=${encodeURIComponent(urlToken)}`,
            { method: "POST" }
          );

          const data = await res.json();

          if (!res.ok || !data?.ok) {
            setErrorMsg(data?.error || "QR token invalid or expired.");
            setAutoLogging(false);
            return;
          }

          // data contains: ok, studentId, username, (optionally jwt if you add it on backend)
          setUsername(data.username || "");
          // If your backend returns a JWT for students, store it as your normal token:
          if (data.jwt) {
            localStorage.setItem("token", data.jwt);
          } else {
            // Fallback: store lightweight session markers if you don't issue JWT yet
            // (Adjust if your student area expects a specific key)
            localStorage.setItem("student_id", String(data.studentId));
            localStorage.setItem("student_username", data.username || "");
            // Optional: a temporary client-only token marker so guards that check 'token' don't fail
            if (!localStorage.getItem("token")) {
              localStorage.setItem("token", `qr:${data.studentId}:${Date.now()}`);
            }
          }

          // Navigate straight to the student dashboard
          navigate("/student-dashboard", { replace: true });
        } catch (e) {
          console.error(e);
          setErrorMsg("QR login failed. Please try again.");
          setAutoLogging(false);
        }
      })();

      return; // Don't also run the username/password autologin block below
    }

    // 2) Old flow: if username & password were passed in URL, auto-submit them
    if (urlUsername && urlPassword) {
      setUsername(urlUsername);
      setPassword(urlPassword);
      handleLogin(urlUsername, urlPassword);
    }
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative min-h-screen bg-white overflow-hidden font-sans">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-5 text-3xl md:text-4xl font-bold text-black z-50 relative"
      >
        <Link to="/"> SpederMath </Link>
      </motion.div>

      <div className="flex flex-col items-center justify-center h-[85vh] space-y-3">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-neucha text-black"
        >
          WELCOME TO
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-5xl font-neucha text-black mb-4"
        >
          SPEDERMATH
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-base text-black mb-8"
        >
          {autoLogging ? "Logging you in…" : "Hello Student, input your username and password"}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="flex flex-col gap-4 w-[487px]"
        >
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="border border-gray-300 rounded-[12px] px-4 py-3 text-[16px] font-neucha focus:outline-none focus:ring-2 focus:ring-[#6a4fa3]"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="border border-gray-300 rounded-[12px] px-4 py-3 text:[16px] font-neucha focus:outline-none focus:ring-2 focus:ring-[#6a4fa3]"
          />

          {errorMsg && (
            <div className="text-red-500 text-sm font-neucha">{errorMsg}</div>
          )}

          <motion.button
            onClick={() => handleLogin()}
            disabled={autoLogging}
            className="bg-[#6a4fa3] hover:bg-[#563d91] text-white font-bold text-[18px] tracking-wide py-[13px] rounded-[18px] font-neucha disabled:opacity-60"
          >
            {autoLogging ? "Logging in…" : "Login"}
          </motion.button>
        </motion.div>
      </div>

      {/* Decorative Images */}
      <motion.img
        src="/red.png"
        alt="red"
        className="absolute bottom-[152px] left-[-152px] w-[550px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 2.5 }}
      />
      <motion.img
        src="/yellow.png"
        alt="yellow"
        className="absolute bottom-[-160px] left-[-145px] w-[500px] rotate-[30deg]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 3, ease: "easeOut" }}
      />
      <motion.img
        src="/blue.png"
        alt="blue"
        className="absolute top-[40px] right-[-150px] w-[300px] rotate-[-39deg]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, delay: 3.5, ease: "easeOut" }}
      />
      <motion.img
        src="/pink.png"
        alt="pink"
        className="absolute bottom-[-40px] right-[-30px] w-[350px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, delay: 4, ease: "easeOut" }}
      />
    </div>
  );
}

export default StudentLogin;
