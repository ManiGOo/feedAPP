import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";
import { motion } from "framer-motion";

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [shakeUsername, setShakeUsername] = useState(false);
  const [shakeEmail, setShakeEmail] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Please enter a username.";
    if (!email.trim()) newErrors.email = "Please enter your email.";
    if (!password) newErrors.password = "Please enter a password.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      if (validationErrors.username) setShakeUsername(true);
      if (validationErrors.email) setShakeEmail(true);
      if (validationErrors.password) setShakePassword(true);

      setTimeout(() => {
        setShakeUsername(false);
        setShakeEmail(false);
        setShakePassword(false);
      }, 500);

      return;
    }

    setErrors({});
    try {
      const res = await api.post("/auth/signup", { username, email, password });
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);

      setSuccess("Signup successful! Redirecting to home...");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      setErrors({ form: err.response?.data?.error || "Signup failed. Try again." });
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
        {/* Floating shapes */}
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
          <p className="text-gray-600 dark:text-gray-300">
            Join the community. Share your thoughts.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <motion.div animate={shakeUsername ? shakeAnimation : {}}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/30 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username}</p>}
          </motion.div>

          <motion.div animate={shakeEmail ? shakeAnimation : {}}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/30 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </motion.div>

          <motion.div animate={shakePassword ? shakeAnimation : {}}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/30 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </motion.div>

          {errors.form && <p className="text-red-600 text-sm text-center">{errors.form}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-500 ease-in-out animated-gradient"
          >
            Sign up
          </motion.button>

        </form>

        {/* Login Link */}
        <p className="mt-6 text-sm text-center relative z-10 text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            Login
          </Link>
        </p>

        {success && <p className="mt-4 text-green-600 text-sm text-center">{success}</p>}
      </motion.div>
    </div>
  );
}
