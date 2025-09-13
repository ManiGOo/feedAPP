import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [shakeUsername, setShakeUsername] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Please enter your username.";
    if (!password) newErrors.password = "Please enter your password.";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      if (validationErrors.username) setShakeUsername(true);
      if (validationErrors.password) setShakePassword(true);

      setTimeout(() => {
        setShakeUsername(false);
        setShakePassword(false);
      }, 500);

      return;
    }

    setErrors({});
    try {
      const res = await login(username, password);
      if (!res.success) {
        setErrors({ form: res.error });
        setShakeUsername(true);
        setShakePassword(true);
        setTimeout(() => {
          setShakeUsername(false);
          setShakePassword(false);
        }, 500);
        return;
      }
      setSuccess("Login successful! Redirecting...");
    } catch (err) {
      setErrors({ form: err.response?.data?.error || "Login failed. Try again." });
    }
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (errors.username && e.target.value.trim()) {
      setErrors((prev) => ({ ...prev, username: undefined }));
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password && e.target.value) {
      setErrors((prev) => ({ ...prev, password: undefined }));
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
        {/* Floating Circles */}
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
          <p className="text-gray-600 dark:text-gray-300">Welcome back! Log in to continue.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <motion.div animate={shakeUsername ? shakeAnimation : {}}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={handleUsernameChange}
              className="w-full p-3 rounded-xl bg-white/30 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username}</p>}
          </motion.div>

          <motion.div animate={shakePassword ? shakeAnimation : {}}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full p-3 rounded-xl bg-white/30 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </motion.div>

          {errors.form && <p className="text-red-600 text-sm">{errors.form}</p>}

          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            className="w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-500 ease-in-out animated-gradient"
          >
            Login
          </motion.button>

        </form>

        {/* Signup Link */}
        <p className="mt-6 text-sm text-center relative z-10">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">
            Sign up
          </Link>
        </p>

        {success && <p className="mt-4 text-green-600 text-sm text-center">{success}</p>}
      </motion.div>
    </div>
  );
}
