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

function App() {
  const location = useLocation();
  const { loading: authLoading, user } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-950">
        <Loader size={60} color="#3b82f6" />
      </div>
    );
  }

  // Apply full-screen layout for MessagesPage and ClipsFeed
  const isFullScreenPage =
    location.pathname.startsWith("/messages") ||
    location.pathname.startsWith("/clips");

  return (
    <div
      className={`flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors ${
        isFullScreenPage ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      <main
        className={`${
          isFullScreenPage ? "h-full" : "flex-1 container mx-auto px-4 py-6"
        }`}
      >
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

          {/* Clips / Reels feed */}
          <Route
            path="/clips"
            element={
              <ProtectedRoute>
                <ClipsFeed />
              </ProtectedRoute>
            }
          />

          {/* Messages route */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage user={user} />
              </ProtectedRoute>
            }
          />

          {/* Profile routes */}
          <Route path="/profile" element={<Navigate to="/profile/me" replace />} />
          <Route
            path="/profile/me"
            element={
              <ProtectedRoute>
                <Profile user={user} />
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
          <Route
            path="/post/:id"
            element={
              <ProtectedRoute>
                <PostPage />
              </ProtectedRoute>
            }
          />

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
          <Route
            path="/post/edit/:id"
            element={
              <ProtectedRoute>
                <EditPost />
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