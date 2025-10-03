import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Home, LogIn, LogOut, User, MessageCircle, Film } from "lucide-react";
import ClipItem from "../components/ClipItem";
import CommentsPanel from "../components/CommentsPanel";
import Loader from "../components/Loader";
import UploadClipOverlay from "../components/UploadClipOverlay";
import api from "../utils/api";
import useClipsSocket from "../hooks/useClipsSocket";

export default function ClipsFeed({ currentUser }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);

  const { user, logout } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  // -------------------- Navigation Item --------------------
  const navItem = (to, Icon, label, notification = false) => (
    <Link
      to={to}
      className={`flex flex-col items-center text-gray-400 hover:text-white transition-transform transform hover:scale-110 relative ${
        path === to ? "text-white" : ""
      }`}
      style={{ flex: "1 0 auto" }}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs mt-1">{label}</span>
      {notification && (
        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </Link>
  );

  // -------------------- Fetch Clips --------------------
  useEffect(() => {
    const fetchClips = async () => {
      try {
        const data = await api.getClips();
        setClips(data);
      } catch (err) {
        console.error("Failed to fetch clips:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClips();
  }, []);

  // -------------------- Swipe Handler --------------------
  const handleSwipe = useCallback(
    (direction) => {
      if (direction === "up" && currentIndex < clips.length - 1) {
        setSwipeDirection("up");
        setCurrentIndex((prev) => prev + 1);
      }
      if (direction === "down" && currentIndex > 0) {
        setSwipeDirection("down");
        setCurrentIndex((prev) => prev - 1);
      }
    },
    [clips.length, currentIndex]
  );

  // -------------------- Clip Counts Update --------------------
  const updateClipCounts = useCallback((clipId, likeCount, commentsCount) => {
    setClips((prev) =>
      prev.map((clip) =>
        clip.id === clipId ? { ...clip, like_count: likeCount, comments_count: commentsCount } : clip
      )
    );
  }, []);

  // -------------------- Comment Added Handler --------------------
  const handleCommentAdded = useCallback(() => {
    const clip = clips[currentIndex];
    if (!clip) return;
    updateClipCounts(clip.id, clip.like_count, (clip.comments_count || 0) + 1);
  }, [clips, currentIndex, updateClipCounts]);

  // -------------------- New Clip Handler --------------------
  const handleNewClip = useCallback(
    async (newClip) => {
      try {
        const profile = await api.getUserProfile(newClip.user_id || newClip.userId);
        const enrichedClip = {
          ...newClip,
          author: profile.username,
          avatar_url: profile.avatar_url,
          like_count: 0,
          comments_count: 0,
          liked_by_me: false,
          is_followed_author: false,
        };
        setClips((prev) => [enrichedClip, ...prev]);
        setCurrentIndex(0);
      } catch (err) {
        console.error("Failed to enrich new clip:", err);
        setClips((prev) => [newClip, ...prev]);
        setCurrentIndex(0);
      }
      setShowUpload(false);
    },
    []
  );

  // -------------------- Socket Integration --------------------
  useClipsSocket({
    clips,
    setClips,
    currentIndex,
    updateClipCounts,
    handleCommentAdded,
    handleNewClip,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <Loader size={50} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center bg-black overflow-hidden relative">
      {/* Post Video button */}
      <div className="fixed top-0 w-full flex justify-center py-2 z-20 bg-black/50 backdrop-blur-md">
        <motion.button
          onClick={() => setShowUpload(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-full shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Post Video
        </motion.button>
      </div>

      {/* Clips Feed */}
      <div className="relative w-full max-w-md flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {clips.length > 0 && (
            <motion.div
              key={clips[currentIndex].id}
              initial={{
                y: swipeDirection === "up" ? 100 : swipeDirection === "down" ? -100 : 0,
                opacity: 0,
              }}
              animate={{ y: 0, opacity: 1 }}
              exit={{
                y: swipeDirection === "up" ? -100 : swipeDirection === "down" ? 100 : 0,
                opacity: 0,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y < -50) handleSwipe("up");
                if (info.offset.y > 50) handleSwipe("down");
              }}
              className="absolute w-full h-full"
            >
              <ClipItem
                clip={clips[currentIndex]}
                onCommentClick={() => setShowComments(true)}
                updateClipCounts={updateClipCounts}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Comments Panel */}
      {clips[currentIndex] && (
        <CommentsPanel
          show={showComments}
          clip={clips[currentIndex]}
          onClose={() => setShowComments(false)}
          onCommentAdded={handleCommentAdded}
        />
      )}

      {/* Upload Overlay */}
      <UploadClipOverlay
        show={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={handleNewClip}
        currentUser={currentUser}
      />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-gray-900 border-t border-gray-800">
        <div
          className="flex justify-between items-center mx-auto"
          style={{ width: "448px", height: "60px", padding: "0 16px" }}
        >
          {navItem("/", Home, "Home")}
          {user && navItem("/messages", MessageCircle, "Messages", true)}
          {navItem("/clips", Film, "Clips")}
          {user && navItem("/profile", User, "Profile")}
          {user ? (
            <button
              onClick={logout}
              className="flex flex-col items-center text-gray-400 hover:text-red-500 transition-transform transform hover:scale-110"
              style={{ flex: "1 0 auto" }}
            >
              <LogOut className="w-6 h-6" />
              <span className="text-xs mt-1">Logout</span>
            </button>
          ) : (
            navItem("/login", LogIn, "Login")
          )}
        </div>
      </nav>
    </div>
  );
}
