import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ClipItem from "../components/ClipItem";
import CommentsPanel from "../components/CommentsPanel";
import Loader from "../components/Loader";
import UploadClipOverlay from "../components/UploadClipOverlay";
import BottomNav from "../components/BottomNav";
import api from "../utils/api";

export default function ClipsFeed({ currentUser }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // Fetch clips on mount
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <Loader size={50} color="#3b82f6" />
      </div>
    );
  }

  // Swipe up/down navigation
  const handleSwipe = (direction) => {
    if (direction === "up") setCurrentIndex((prev) => Math.min(prev + 1, clips.length - 1));
    if (direction === "down") setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  // Update likes/comments counts for a clip
  const updateClipCounts = (clipId, likeCount, commentsCount) => {
    setClips((prev) =>
      prev.map((clip) =>
        clip.id === clipId ? { ...clip, like_count: likeCount, comments_count: commentsCount } : clip
      )
    );
  };

  const handleCommentAdded = () => {
    const clipId = clips[currentIndex].id;
    const currentCount = clips[currentIndex].comments_count || 0;
    updateClipCounts(clipId, clips[currentIndex].like_count, currentCount + 1);
  };

  // Add new uploaded clip at top
  const handleNewClip = async (newClip) => {
    try {
      // Fetch current user profile to enrich clip with avatar/title
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
      // fallback: add clip without avatar info
      setClips((prev) => [newClip, ...prev]);
      setCurrentIndex(0);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-black pb-16">
      {/* Post Video button */}
      <div className="w-full flex justify-center py-2 z-10">
        <button
          onClick={() => setShowUpload(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-full shadow"
        >
          Post Video
        </button>
      </div>

      {/* Clips Feed */}
      <div className="relative w-[390px] h-[844px] rounded-2xl overflow-hidden">
        <AnimatePresence initial={false}>
          {clips.length > 0 && (
            <motion.div
              key={clips[currentIndex].id}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
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
        currentUser={currentUser} // Pass current user to populate author/avatar
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
