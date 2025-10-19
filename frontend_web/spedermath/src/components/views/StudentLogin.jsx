import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

async function readJsonSafe(resp) {
  const ct = resp.headers.get("content-type") || "";
  const raw = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status} – ${raw.slice(0, 300)}`);
  if (!ct.includes("application/json")) throw new Error(`Expected JSON but got ${ct}`);
  return JSON.parse(raw);
}

function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [autoLogging, setAutoLogging] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (user = username, pass = password) => {
    try {
      const response = await fetch("http://localhost:8080/api/students/student-login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });

      const result = await readJsonSafe(response);

      if (result.token || result.jwt) {
        // keep your existing keys
        localStorage.setItem("token", result.token || result.jwt);
        localStorage.setItem("student_username", user);
        // optionally store ids if backend returns them
        if (result.studentId != null) localStorage.setItem("student_id", String(result.studentId));
        navigate("/student-dashboard");
      } else {
        setErrorMsg(result.message || "Login failed: Invalid username or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg(error.message || "An error occurred. Please try again.");
    }
  };

  // QR token flow (auto-login)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token"); // from /public/qr-login?token=...
    const urlUsername = params.get("username");
    const urlPassword = params.get("password");

    const existingToken = localStorage.getItem("token");
    if (existingToken && !urlToken) return;

    // 1) If a QR token is present, exchange it and auto-login
    if (urlToken) {
      (async () => {
        try {
          setAutoLogging(true);
          setErrorMsg("");

          // CHANGED: use POST (JSON body) for QR exchange
          const res = await fetch("http://localhost:8080/public/qr-exchange", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ token: urlToken }),
          });

          const data = await readJsonSafe(res);

          // accept direct payload { jwt, studentId, username }
          const jwt = data.jwt || data.token;
          if (!jwt && data.error) {
            setErrorMsg(data.error || "QR token invalid or expired.");
            return;
          }

          if (data.username) setUsername(data.username);

          if (jwt) {
            localStorage.setItem("token", jwt); // keep your 'token' key
          }
          if (data.studentId != null) {
            localStorage.setItem("student_id", String(data.studentId));
          }
          if (data.username) {
            localStorage.setItem("student_username", data.username);
          }

          // Clean URL so refreshes don't retry the one-time token
          window.history.replaceState({}, "", window.location.pathname);
          navigate("/student-dashboard", { replace: true });
        } catch (e) {
          console.error(e);
          setErrorMsg(e.message || "QR login failed. Please try again.");
        } finally {
          setAutoLogging(false);
        }
      })();

      return; // Don't also run the username/password autologin block below
    }

    // 2) If username & password were passed in URL, auto-submit them
    if (urlUsername && urlPassword) {
      setUsername(urlUsername);
      setPassword(urlPassword);
      handleLogin(urlUsername, urlPassword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

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
            className="border border-gray-300 rounded-[12px] px-4 py-3 text-[16px] font-neucha focus:outline-none focus:ring-2 focus:ring-[#6a4fa3]"
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
