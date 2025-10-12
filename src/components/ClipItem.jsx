import React, { useRef, useState, useCallback, useEffect } from "react";
import { FaHeart, FaComment, FaPlay } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

function ClipItem({ clip, isActive, onCommentClick, updateClipCounts }) {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(false);
  const [likes, setLikes] = useState(clip.like_count || 0);
  const [likedByMe, setLikedByMe] = useState(clip.liked_by_me || false);
  const [commentsCount, setCommentsCount] = useState(clip.comments_count || 0);
  const [showHeart, setShowHeart] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);

  // Sync local counts with prop changes (e.g., external updates via sockets or comments)
  useEffect(() => {
    setLikes(clip.like_count || 0);
    setLikedByMe(clip.liked_by_me || false);
    setCommentsCount(clip.comments_count || 0);
  }, [clip.like_count, clip.liked_by_me, clip.comments_count]);

  // Handle autoplay/pause based on active state
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {
        videoRef.current.muted = true;
        videoRef.current.play().catch(console.error);
      });
      setShowPlayButton(false); // Ensure no play button on switch/autoplay
    } else {
      videoRef.current.pause();
      videoRef.current.muted = true;
    }
  }, [isActive]);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.muted = false; // Try unmute on user gesture
      videoRef.current.play().catch(() => {
        videoRef.current.muted = true;
        videoRef.current.play().catch(console.error);
      });
      setShowPlayButton(false);
    } else {
      videoRef.current.pause();
      setShowPlayButton(true);
    }
  }, []);

  const toggleLike = async () => {
    if (!clip) return;
    try {
      const newLikes = likedByMe ? Math.max(likes - 1, 0) : likes + 1;
      const newLikedState = !likedByMe;

      if (likedByMe) await api.unlikeClip(clip.id);
      else await api.likeClip(clip.id);

      setLikes(newLikes);
      setLikedByMe(newLikedState);
      updateClipCounts?.(clip.id, newLikes, commentsCount);
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  let lastTap = 0;
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      toggleLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTap = now;
  };

  return (
    <div className="relative flex justify-center items-center w-full h-full bg-black overflow-hidden">
      <div className="max-w-[500px] max-h-[90vh] w-full h-full flex justify-center items-center">
        <AnimatePresence mode="wait">
          <motion.video
            key={clip.id}
            ref={videoRef}
            src={clip.video_url}
            className="w-full h-full object-cover rounded-2xl cursor-pointer"
            loop
            playsInline
            onClick={togglePlayPause}
            onDoubleClick={handleDoubleTap}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 0.95 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onLoadedMetadata={() => setLoaded(true)}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </AnimatePresence>

        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute text-white text-6xl z-30 pointer-events-none"
          >
            <FaHeart className="text-red-500 drop-shadow-lg" />
          </motion.div>
        )}
      </div>

      {showPlayButton && (
        <motion.button
          onClick={togglePlayPause}
          className="absolute inset-0 m-auto w-16 h-16 flex justify-center items-center text-white bg-black/60 rounded-full z-20"
        >
          <FaPlay />
        </motion.button>
      )}

      <div className="absolute bottom-[20%] right-4 flex flex-col items-center gap-6 z-20">
        <button onClick={toggleLike} className="flex flex-col items-center text-white">
          <FaHeart className={`text-3xl ${likedByMe ? "text-red-500" : "text-white"}`} />
          <span className="text-sm">{likes}</span>
        </button>
        <button onClick={onCommentClick} className="flex flex-col items-center text-white">
          <FaComment className="text-3xl" />
          <span className="text-sm">{commentsCount}</span>
        </button>
      </div>

      <div className="absolute bottom-16 left-4 text-white z-20 flex flex-col gap-2 max-w-[90vw]">
        <p className="font-bold text-sm truncate">{clip.title}</p>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/profile/${clip.author_id}`)}>
          <img
            src={clip.avatar_url || "/default-avatar.png"}
            alt={clip.author}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="font-semibold text-sm truncate max-w-[60vw]">{clip.author}</span>
        </div>
      </div>
    </div>
  );
}

export default ClipItem;