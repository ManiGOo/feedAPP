// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    // 🚫 not logged in → redirect to login
    return <Navigate to="/login" replace />;
  }

  // ✅ logged in → show the page
  return children;
}
