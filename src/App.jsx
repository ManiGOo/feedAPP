// src/App.jsx
import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
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
import MessagesPage from "./pages/MessagesPage";
import { useAuth } from "./context/AuthContext";
import ClipsFeed from "./pages/ClipsFeed";
import EditPost from "./pages/EditPost";

import ClipDetail from "./pages/ClipDetail";

function App() {
  const location = useLocation();
  const { loading: authLoading, user } = useAuth();

  // Full-screen pages: no padding, no container, full height
  const fullScreenPaths = ["/messages", "/clips"];
  const isFullScreen = fullScreenPaths.some(path => 
    location.pathname.startsWith(path)
  );

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-950">
        <Loader size={60} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div className={`
      flex flex-col
      bg-gray-50 dark:bg-gray-950
      text-gray-900 dark:text-gray-100
      transition-colors
      ${isFullScreen ? "h-screen overflow-hidden" : "min-h-screen"}
    `}>
      <main className={isFullScreen ? "h-full" : "flex-1"}>
        <Routes>
          {/* === FULL-SCREEN ROUTES === */}
          <Route
            path="/clips"
            element={
              <ProtectedRoute>
                <ClipsFeed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clips/:clipId"
            element={
              <ProtectedRoute>
                <ClipDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/*"
            element={
              <ProtectedRoute>
                <MessagesPage user={user} />
              </ProtectedRoute>
            }
          />

          {/* === STANDARD LAYOUT ROUTES === */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="container mx-auto px-4 py-6">
                  <Home />
                </div>
              </ProtectedRoute>
            }
          />

          <Route path="/profile" element={<Navigate to="/profile/me" replace />} />
          <Route
            path="/profile/me"
            element={
              <ProtectedRoute>
                <div className="container mx-auto px-4 py-6">
                  <Profile user={user} />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <div className="container mx-auto px-4 py-6">
                  <Profile />
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/posts/:id"
            element={
              <ProtectedRoute>
                <div className="container mx-auto px-4 py-6">
                  <PostDetail />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/post/:id"
            element={
              <ProtectedRoute>
                <div className="container mx-auto px-4 py-6">
                  <PostPage />
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/post/edit/:id"
            element={
              <ProtectedRoute>
                <div className="container mx-auto px-4 py-6">
                  <EditPost />
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/following"
            element={
              <ProtectedRoute>
                <div className="container mx-auto px-4 py-6">
                  <Following />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/follow/:type/:userId"
            element={
              <ProtectedRoute>
                <div className="container mx-auto px-4 py-6">
                  <Follow />
                </div>
              </ProtectedRoute>
            }
          />

          {/* === PUBLIC ROUTES === */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* === 404 === */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
