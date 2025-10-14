// src/pages/ClipsFeed.jsx (assuming this is the file path)
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ClipItem from "../components/ClipItem";
import CommentsPanel from "../components/CommentsPanel";
import Loader from "../components/Loader";
import UploadClipOverlay from "../components/UploadClipOverlay";
import api from "../utils/api";
import useClipsSocket from "../hooks/useClipsSocket";
import { useAuth } from "../context/AuthContext.jsx";
import GlobalBottomNav from "../components/GlobalBottomNav.jsx";
import { ClipsProvider } from "../context/ClipsContext.jsx";

export default function ClipsFeed() {
  const { user: currentUser } = useAuth();
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Fetch Clips
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

  // Update Clip
  const updateClip = useCallback(
    (clipId, updates) => {
      setClips((prev) =>
        prev.map((c) => (c.id === clipId ? { ...c, ...updates } : c))
      );
    },
    []
  );

  const handleCommentAdded = useCallback(() => {
    const clip = clips[currentIndex];
    if (!clip) return;
    updateClip(clip.id, {
      comments_count: (clip.comments_count || 0) + 1,
    });
  }, [clips, currentIndex, updateClip]);

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

  useClipsSocket({ clips, setClips, currentIndex, updateClip, handleCommentAdded, handleNewClip });

  // Drag Handling
  const handleDragEnd = (offset, velocity) => {
    const threshold = 120;
    const momentum = Math.min(Math.floor(Math.abs(velocity) / 700), 3) || 1;

    if (offset < -threshold || velocity < -200) {
      setCurrentIndex((prev) => Math.min(prev + momentum, clips.length - 1));
    } else if (offset > threshold || velocity > 200) {
      setCurrentIndex((prev) => Math.max(prev - momentum, 0));
    }
    setDragOffset(0);
  };

  if (loading) return <Loader size={50} color="#3b82f6" />;

  const contextValue = {
    clips,
    updateClip,
    currentIndex,
  };

  return (
    <ClipsProvider value={contextValue}>
      <div
        className="relative w-full h-screen bg-black overflow-hidden flex justify-center items-center"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Upload Button */}
        <AnimatePresence>
          {!showComments && !showUpload && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed top-4 w-full flex justify-center z-20 bg-black/40 backdrop-blur-md py-3"
            >
              <motion.button
                onClick={() => setShowUpload(true)}
                className="bg-blue-500 text-white px-5 py-2 rounded-full shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Post Video
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clips Feed */}
        <div className="absolute w-full h-full flex justify-center items-center overflow-hidden">
          <AnimatePresence>
            {clips.map((clip, idx) => {
              if (Math.abs(idx - currentIndex) > 1) return null;

              const isCurrent = idx === currentIndex;
              const isNext = idx > currentIndex;
              const baseY = isCurrent
                ? dragOffset
                : isNext
                ? window.innerHeight + dragOffset
                : -window.innerHeight + dragOffset;
              const zIndex = isCurrent ? 10 : 5;

              return (
                <motion.div
                  key={clip.id}
                  drag={isCurrent ? "y" : false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.5}
                  onDrag={(e, info) => setDragOffset(info.offset.y)}
                  onDragEnd={(e, info) => handleDragEnd(info.offset.y, info.velocity.y)}
                  initial={{ y: isNext ? "100%" : "-100%", opacity: 0 }}
                  animate={{ y: baseY, opacity: 1 }}
                  exit={{ y: isNext ? "-100%" : "100%", opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute w-full h-full flex justify-center items-center"
                  style={{ zIndex }}
                >
                  <div className="w-full h-full max-w-[500px] max-h-[90vh]">
                    <ClipItem
                      clip={clip}
                      isActive={isCurrent}
                      onCommentClick={() => setShowComments(true)}
                    />
                  </div>
                </motion.div>
              );
            })}
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
        {!showComments && (
          <div className="fixed bottom-0 left-0 w-full z-20">
            <GlobalBottomNav />
          </div>
        )}
      </div>
    </ClipsProvider>
  );
}