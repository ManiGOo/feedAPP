// src/pages/ClipsFeed.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
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

  const feedRef = useRef(null);
  const wheelTimeout = useRef(null);

  // -------------------------------------------------
  // FETCH CLIPS
  // -------------------------------------------------
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

  // -------------------------------------------------
  // SOCKET & CONTEXT HELPERS
  // -------------------------------------------------
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

  // -------------------------------------------------
  // NAVIGATION HELPERS
  // -------------------------------------------------
  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, clips.length - 1));
  }, [clips.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // -------------------------------------------------
  // DRAG (SWIPE) – ONE VIDEO PER SWIPE
  // -------------------------------------------------
  const handleDragEnd = (offsetY, velocityY) => {
    const THRESHOLD = 120;               // px
    const VELOCITY_THRESHOLD = 200;      // px/s

    if (offsetY < -THRESHOLD || velocityY < -VELOCITY_THRESHOLD) {
      goNext();
    } else if (offsetY > THRESHOLD || velocityY > VELOCITY_THRESHOLD) {
      goPrev();
    }
    setDragOffset(0);
  };

  // -------------------------------------------------
  // MOUSE WHEEL
  // -------------------------------------------------
  const handleWheel = useCallback(
    (e) => {
      if (wheelTimeout.current) return;
      wheelTimeout.current = setTimeout(() => (wheelTimeout.current = null), 300);

      if (e.deltaY > 0) goNext();
      else if (e.deltaY < 0) goPrev();
    },
    [goNext, goPrev]
  );

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: true });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // -------------------------------------------------
  // LOADER
  // -------------------------------------------------
  if (loading) return <Loader size={50} color="#3b82f6" />;

  // -------------------------------------------------
  // CONTEXT
  // -------------------------------------------------
  const contextValue = { clips, updateClip, currentIndex };

  // -------------------------------------------------
  // RENDER
  // -------------------------------------------------
  return (
    <ClipsProvider value={contextValue}>
      <div
        ref={feedRef}
        className="relative w-full h-screen bg-black overflow-hidden flex justify-center items-center"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* ---------- UPLOAD BUTTON ---------- */}
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

        {/* ---------- ARROW BUTTONS (Desktop hover / Mobile always) ---------- */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30 md:opacity-0 md:hover:opacity-100 transition-opacity">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full disabled:opacity-30"
            aria-label="Previous video"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          <button
            onClick={goNext}
            disabled={currentIndex === clips.length - 1}
            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full disabled:opacity-30"
            aria-label="Next video"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* ---------- CLIPS FEED ---------- */}
        <div className="absolute inset-0 flex justify-center items-center overflow-hidden">
          <AnimatePresence initial={false}>
            {clips.map((clip, idx) => {
              // Render only the current clip + the one before/after it
              if (Math.abs(idx - currentIndex) > 1) return null;

              const isCurrent = idx === currentIndex;
              const isNext = idx > currentIndex;

              const baseY = isCurrent
                ? dragOffset
                : isNext
                ? window.innerHeight
                : -window.innerHeight;

              return (
                <motion.div
                  key={clip.id}
                  // Only the active clip is draggable
                  drag={isCurrent ? "y" : false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.4}
                  onDrag={(e, { offset }) => setDragOffset(offset.y)}
                  onDragEnd={(e, { offset, velocity }) => handleDragEnd(offset.y, velocity.y)}
                  initial={{ y: isNext ? "100%" : "-100%" }}
                  animate={{ y: baseY, opacity: 1 }}
                  exit={{ y: isNext ? "-100%" : "100%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute w-full h-full flex justify-center items-center"
                  style={{ zIndex: isCurrent ? 10 : 5 }}
                >
                  {/* ---- VIDEO CONTAINER (keeps original aspect) ---- */}
                  <div className="relative w-full h-full max-w-[500px] max-h-[90vh] flex justify-center items-center bg-black">
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

        {/* ---------- COMMENTS ---------- */}
        {clips[currentIndex] && (
          <CommentsPanel
            show={showComments}
            clip={clips[currentIndex]}
            onClose={() => setShowComments(false)}
            onCommentAdded={handleCommentAdded}
          />
        )}

        {/* ---------- UPLOAD OVERLAY ---------- */}
        <UploadClipOverlay
          show={showUpload}
          onClose={() => setShowUpload(false)}
          onUploaded={handleNewClip}
          currentUser={currentUser}
        />

        {/* ---------- BOTTOM NAV ---------- */}
        {!showComments && (
          <div className="fixed bottom-0 left-0 w-full z-20">
            <GlobalBottomNav />
          </div>
        )}
      </div>
    </ClipsProvider>
  );
}