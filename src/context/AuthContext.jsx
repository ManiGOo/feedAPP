import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  const fetchUser = async (accessToken) => {
    try {
      const res = await api.get("/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const access = localStorage.getItem("accessToken");
    if (access) {
      fetchUser(access);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    setUser(res.data.user);
  };

  const signup = async (username, email, password) => {
    const res = await api.post("/auth/signup", { username, email, password });
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    setUser(res.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
