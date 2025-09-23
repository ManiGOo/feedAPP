// src/App.jsx
import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Loader from "./components/Loader";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import PostDetail from "./pages/PostDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Following from "./pages/Following";
import PostPage from "./pages/PostPage";
import Follow from "./pages/Follow";
import { useAuth } from "./context/AuthContext";

function App() {
  const location = useLocation();
  const { loading: authLoading } = useAuth();

  // Hide navbar on auth pages
  const hideNavbar = ["/login", "/signup"].includes(location.pathname);

  if (authLoading) {
    // Show global loader while auth state is being determined
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-950">
        <Loader size={60} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors flex flex-col">
      {/* Navbar */}
      {!hideNavbar && <Navbar />}

      {/* Main content */}
      <main className={`flex-1 ${!hideNavbar ? "container mx-auto px-4 py-6" : ""}`}>
        <Routes>
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Profile routes */}
          <Route path="/profile" element={<Navigate to="/profile/me" replace />} />
          <Route
            path="/profile/me"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Post routes */}
          <Route
            path="/posts/:id"
            element={
              <ProtectedRoute>
                <PostDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/post/:id" element={<PostPage />} />

          {/* Other protected routes */}
          <Route
            path="/following"
            element={
              <ProtectedRoute>
                <Following />
              </ProtectedRoute>
            }
          />
          <Route
            path="/follow/:type/:userId"
            element={
              <ProtectedRoute>
                <Follow />
              </ProtectedRoute>
            }
          />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
