// src/components/ResetPassword.jsx (Rewritten)
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../utils/api";  // ← ADDED: Use shared API instance (respects VITE_API_URL)

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [shakePass, setShakePass] = useState(false);
  const [shakeConfirm, setShakeConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No token provided");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      setShakeConfirm(true);
      setTimeout(() => setShakeConfirm(false), 500);
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      setShakePass(true);
      setTimeout(() => setShakePass(false), 500);
      return;
    }
    try {
      // ← FIXED: Use `api.post("/auth/...")` instead of raw `axios.post("/api/...")`
      // This hits your Render backend via VITE_API_URL
      const res = await api.post("/auth/password/reset", {
        token,
        newPassword: password,
      });
      setMsg(res.data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Network error");
      setShakePass(true);
      setShakeConfirm(true);
      setTimeout(() => {
        setShakePass(false);
        setShakeConfirm(false);
      }, 500);
    }
  };

  const shakeAnimation = {
    x: [-5, 5, -5, 5, 0],
    transition: { duration: 0.4 },
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-950 dark:to-gray-900 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-2xl p-10 rounded-3xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Floating Orbs */}
        <motion.div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-blue-400/20 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-purple-400/20 blur-3xl"
          animate={{ y: [0, -15, 0], x: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        />
        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-2"
          >
            Feed
          </motion.div>
          <p className="text-gray-600 dark:text-gray-300">Set your new password.</p>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <motion.div animate={shakePass ? shakeAnimation : {}}>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/30 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </motion.div>
          <motion.div animate={shakeConfirm ? shakeAnimation : {}}>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/30 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </motion.div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-500 ease-in-out animated-gradient"
          >
            Update Password
          </motion.button>
        </form>
        {/* Back to Login */}
        <p className="mt-6 text-sm text-center relative z-10">
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to Login
          </Link>
        </p>
        {msg && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-green-600 text-sm text-center"
          >
            {msg} Redirecting...
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}