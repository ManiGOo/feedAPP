import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Logout
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  // Fetch current user using access token
  const fetchUser = async () => {
    const access = localStorage.getItem("accessToken");
    if (!access) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/users/me", {
        headers: { Authorization: `Bearer ${access}` },
      });
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      logout(); // invalid token
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Login
  const login = async (username, password) => {
    try {
      const res = await api.post("/auth/login", { username, password });
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      console.error("Login failed:", err);
      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  // Signup
  const signup = async (username, email, password) => {
    try {
      const res = await api.post("/auth/signup", { username, email, password });
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      console.error("Signup failed:", err);
      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
