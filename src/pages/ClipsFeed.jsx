import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ClipItem from "../components/ClipItem";
import CommentsPanel from "../components/CommentsPanel";
import Loader from "../components/Loader";
import UploadClipOverlay from "../components/UploadClipOverlay";
import api from "../utils/api";
import useClipsSocket from "../hooks/useClipsSocket";
import { useAuth } from "../context/AuthContext.jsx";
import BottomNav from "../components/BottomNav";

export default function ClipsFeed() {
  const { user: currentUser } = useAuth();
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

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

  // -------------------- Update Clip Counts --------------------
  const updateClipCounts = useCallback((clipId, likeCount, commentsCount) => {
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, like_count: likeCount, comments_count: commentsCount } : c));
  }, []);

  const handleCommentAdded = useCallback(() => {
    const clip = clips[currentIndex];
    if (!clip) return;
    updateClipCounts(clip.id, clip.like_count, (clip.comments_count || 0) + 1);
  }, [clips, currentIndex, updateClipCounts]);

  const handleNewClip = useCallback(async (newClip) => {
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
      setClips(prev => [enrichedClip, ...prev]);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Failed to enrich new clip:", err);
      setClips(prev => [newClip, ...prev]);
      setCurrentIndex(0);
    }
    setShowUpload(false);
  }, []);

  useClipsSocket({ clips, setClips, currentIndex, updateClipCounts, handleCommentAdded, handleNewClip });

  // -------------------- Drag Handling --------------------
  const handleDragEnd = (offset, velocity) => {
    const threshold = 120;
    const momentum = Math.min(Math.floor(Math.abs(velocity) / 700), 3) || 1;

    if (offset < -threshold || velocity < -200) {
      setCurrentIndex(prev => Math.min(prev + momentum, clips.length - 1));
    } else if (offset > threshold || velocity > 200) {
      setCurrentIndex(prev => Math.max(prev - momentum, 0));
    }
    setDragOffset(0);
  };

  if (loading) return <Loader size={50} color="#3b82f6" />;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex justify-center items-center">
      {/* Upload Button */}
      <div className="fixed top-0 w-full flex justify-center py-2 z-20 bg-black/40 backdrop-blur-md">
        <motion.button
          onClick={() => setShowUpload(true)}
          className="bg-blue-500 text-white px-5 py-2 rounded-full shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Post Video
        </motion.button>
      </div>

      {/* Clips Feed */}
      <div className="absolute w-full h-full flex justify-center items-center overflow-hidden">
        <AnimatePresence mode="wait">
          {clips.map((clip, idx) => {
            if (Math.abs(idx - currentIndex) > 1) return null;

            const baseY = idx === currentIndex ? dragOffset : (idx > currentIndex ? window.innerHeight + dragOffset : -window.innerHeight + dragOffset);
            const scale = idx === currentIndex ? 1 : 0.95;
            const opacity = idx === currentIndex ? 1 : 0.5;

            return (
              <motion.div
                key={clip.id}
                drag={idx === currentIndex ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.5}
                onDrag={(e, info) => setDragOffset(info.offset.y)}
                onDragEnd={(e, info) => handleDragEnd(info.offset.y, info.velocity.y)}
                initial={{ y: baseY, scale, opacity }}
                animate={{ y: baseY, scale, opacity }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="absolute w-full h-full flex justify-center items-center z-10"
              >
                <div className="w-full h-full max-w-[500px] max-h-[90vh]">
                  <ClipItem
                    clip={clip}
                    isActive={idx === currentIndex}
                    onCommentClick={() => setShowComments(true)}
                    updateClipCounts={updateClipCounts}
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
        <div className="fixed bottom-0 left-0 w-full h-[60px] z-20">
          <BottomNav />
        </div>
      )}
    </div>
  );
}