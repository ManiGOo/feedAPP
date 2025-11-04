import React, { useEffect, useState, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ClipItem from "../components/ClipItem.jsx";
import CommentsPanel from "../components/CommentsPanel.jsx";
import Loader from "../components/Loader.jsx";
import GlobalBottomNav from "../components/GlobalBottomNav.jsx";
import api from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ClipsProvider } from "../context/ClipsContext.jsx";

// Memoized Back Button
const BackButton = memo(({ onClick }) => (
  <motion.button
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="fixed top-4 left-4 z-30 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full"
    onClick={onClick}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
  >
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </motion.button>
));

BackButton.displayName = "BackButton";

export default function ClipDetail() {
  const { clipId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [clip, setClip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);

  // Local optimistic update for comment count
  const updateClip = useCallback((updates) => {
    setClip((prev) => prev ? { ...prev, ...updates } : prev);
  }, []);

  // Handle new comment added
  const handleCommentAdded = useCallback(() => {
    updateClip({ comments_count: (clip?.comments_count ?? 0) + 1 });
  }, [clip, updateClip]);

  // Fetch clip on mount or clipId change
  useEffect(() => {
    let mounted = true;

    const fetchClip = async () => {
      try {
        setLoading(true);
        const data = await api.getClipById(clipId);
        if (mounted) setClip(data);
      } catch (err) {
        console.error("Failed to fetch clip:", err);
        if (mounted) navigate("/clips", { replace: true });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchClip();

    return () => {
      mounted = false;
    };
  }, [clipId, navigate]);

  // Show loader
  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex justify-center items-center">
        <Loader size={50} color="#3b82f6" />
      </div>
    );
  }

  // Clip not found
  if (!clip) return null;

  return (
    <ClipsProvider>
      <div
        className="relative w-full h-screen bg-black overflow-hidden flex justify-center items-center"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Back Button */}
        <BackButton onClick={() => navigate(-1)} />

        {/* Main Clip */}
        <div className="absolute inset-0 flex justify-center items-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full max-w-[500px] max-h-[90vh] flex justify-center items-center bg-black"
          >
            <ClipItem
              clip={clip}
              isActive={true}
              onCommentClick={() => setShowComments(true)}
            />
          </motion.div>
        </div>

        {/* Comments Panel */}
        <CommentsPanel
          show={showComments}
          clip={clip}
          onClose={() => setShowComments(false)}
          onCommentAdded={handleCommentAdded}
        />

        {/* Bottom Navigation (hidden when comments open) */}
        {!showComments && (
          <div className="fixed bottom-0 left-0 w-full z-20">
            <GlobalBottomNav />
          </div>
        )}
      </div>
    </ClipsProvider>
  );
}