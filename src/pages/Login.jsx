// src/pages/Login.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");  // changed from email
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/auth/login", { username, password }); // send username

      // Save both tokens
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate(`/profile/${res.data.user.id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors">
      <div className="bg-white dark:bg-gray-900 shadow-md p-6 rounded-lg w-96 transition-colors">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Login</h2>

        {error && (
          <p className="mb-4 text-red-600 text-sm bg-red-100 dark:bg-red-900/40 p-2 rounded">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-4 text-green-600 text-sm bg-green-100 dark:bg-green-900/40 p-2 rounded">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"  // changed from email
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-gray-700 dark:text-gray-300 text-sm text-center">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
