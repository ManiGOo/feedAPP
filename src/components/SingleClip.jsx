// src/components/SingleClip.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaHeart, FaComment, FaPlay, FaArrowLeft, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api.js";
import Loader from "./Loader.jsx";
import CommentsPanel from "./CommentsPanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function SingleClip() {
  const { clipId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);

  const [clip, setClip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likes, setLikes] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [canPlay, setCanPlay] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Fetch clip
  useEffect(() => {
    const fetchClip = async () => {
      if (!clipId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await api.getClipById(clipId);
        setClip(data);
        setLikes(data.like_count || 0);
        setLikedByMe(data.liked_by_me || false);
        setCommentsCount(data.comments_count || 0);
      } catch (err) {
        console.error("Failed to load clip:", err);
        setError("Clip not found or failed to load.");
      } finally {
        setLoading(false);
      }
    };
    fetchClip();
  }, [clipId]);

  // Video ready
  const handleCanPlay = () => setCanPlay(true);
  const handleError = (e) => {
    console.error("Video error:", e);
    setError("Failed to load video.");
  };

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current || !canPlay) return;
    const video = videoRef.current;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Play failed, trying muted:", err);
        video.muted = true;
        setIsMuted(true);
        video.play().catch(console.error);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [canPlay]);

  // Toggle mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  // Double-tap to like
  let lastTap = 0;
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      toggleLike();
    }
    lastTap = now;
  };

  // Like with optimistic update
  const toggleLike = async () => {
    if (!clip || isLiking || !user) return;

    const wasLiked = likedByMe;
    const newLikes = wasLiked ? likes - 1 : likes + 1;
    const newLiked = !wasLiked;

    setLikes(newLikes);
    setLikedByMe(newLiked);
    setIsLiking(true);

    try {
      const res = wasLiked
        ? await api.unlikeClip(clip.id)
        : await api.likeClip(clip.id);
      setLikes(res.like_count);
      setLikedByMe(res.liked_by_me);
    } catch (err) {
      setLikes(likes);
      setLikedByMe(likedByMe);
    } finally {
      setIsLiking(false);
    }
  };

  // Heart animation
  useEffect(() => {
    if (likedByMe && !isLiking) {
      setShowHeart(true);
      const t = setTimeout(() => setShowHeart(false), 800);
      return () => clearTimeout(t);
    }
  }, [likedByMe, isLiking]);

  if (loading) return <Loader size={60} color="#3b82f6" />;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;
  if (!clip) return null;

  return (
    <div className="relative min-h-screen bg-black flex flex-col text-white">
      {/* Back Button */}
      <motion.button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-30 bg-black/60 backdrop-blur-sm text-white p-3 rounded-full"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FaArrowLeft className="text-xl" />
      </motion.button>

      {/* Video */}
      <div className="relative flex-1 flex justify-center items-center p-4">
        <div className="relative max-w-lg w-full">
          <motion.video
            ref={videoRef}
            src={clip.video_url}
            className="w-full rounded-2xl shadow-2xl cursor-pointer"
            loop
            playsInline
            preload="metadata"
            crossOrigin="anonymous"
            onCanPlay={handleCanPlay}
            onError={handleError}
            onClick={togglePlayPause}
            onDoubleClick={handleDoubleTap}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />

          {/* Play Button */}
          <AnimatePresence>
            {!isPlaying && canPlay && (
              <motion.button
                onClick={togglePlayPause}
                className="absolute inset-0 m-auto w-16 h-16 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white rounded-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaPlay className="ml-1 text-2xl" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Mute Button */}
          {canPlay && (
            <motion.button
              onClick={toggleMute}
              className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm p-2 rounded-full"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            </motion.button>
          )}

          {/* Heart Animation */}
          <AnimatePresence>
            {showHeart && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.8, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <FaHeart className="text-red-500 text-7xl drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-10">
        <h1 className="text-xl font-bold mb-2 line-clamp-2">{clip.title}</h1>

        {/* Author */}
        <div
          className="flex items-center gap-3 cursor-pointer mb-6"
          onClick={() => navigate(`/profile/${clip.author_id}`)}
        >
          <img
            src={clip.avatar_url || "/default-avatar.png"}
            alt={clip.author}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
          />
          <span className="font-semibold">{clip.author}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-10">
          <motion.button
            onClick={toggleLike}
            disabled={isLiking}
            className="flex flex-col items-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaHeart
              className={`text-3xl transition-colors ${
                likedByMe ? "text-red-500" : "text-white"
              }`}
            />
            <span className="text-sm mt-1">{likes}</span>
          </motion.button>

          <motion.button
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaComment className="text-3xl" />
            <span className="text-sm mt-1">{commentsCount}</span>
          </motion.button>
        </div>
      </div>

      {/* Comments Panel */}
      <CommentsPanel
        show={showComments}
        clip={clip}
        onClose={() => setShowComments(false)}
        onCommentAdded={() => setCommentsCount(c => c + 1)}
      />
    </div>
  );
}