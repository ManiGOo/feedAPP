// src/components/ClipItem.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import { FaHeart, FaComment, FaPlay } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function ClipItem({ clip, onCommentClick, updateClipCounts }) {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const [paused, setPaused] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);

  const [likes, setLikes] = useState(clip.like_count || 0);
  const [likedByMe, setLikedByMe] = useState(clip.liked_by_me || false);
  const [commentsCount, setCommentsCount] = useState(clip.comments_count || 0);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => setPaused(true));
      setPaused(false);
    } else {
      videoRef.current.pause();
      setPaused(true);
    }
  }, []);

  const toggleLike = async () => {
    if (!clip) return;
    try {
      let newLikes = likes;
      let newLikedState = likedByMe;
      if (likedByMe) {
        await api.unlikeClip(clip.id);
        newLikes = Math.max(likes - 1, 0);
        newLikedState = false;
      } else {
        await api.likeClip(clip.id);
        newLikes = likes + 1;
        newLikedState = true;
      }
      setLikes(newLikes);
      setLikedByMe(newLikedState);
      updateClipCounts?.(clip.id, newLikes, commentsCount);
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleCommentClick = () => onCommentClick?.(clip);

  // Autoplay / IntersectionObserver
  useEffect(() => {
    if (!videoRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!videoRef.current) return;
        if (entry.isIntersecting && !paused) videoRef.current.play().catch(() => setPaused(true));
        else videoRef.current.pause();
      },
      { threshold: 0.75 }
    );
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [paused]);

  // Video time / duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => !dragging && setCurrentTime(video.currentTime);
    const onLoadedMeta = () => {
      setDuration(video.duration);
      setLoaded(true);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMeta);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMeta);
    };
  }, [dragging]);

  // Seek handlers
  const handleSeekStart = () => setDragging(true);
  const handleSeekMove = (e) => {
    if (!dragging || !videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const pos = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const newTime = (pos / rect.width) * duration;
    setCurrentTime(newTime);
    videoRef.current.currentTime = newTime;
  };
  const handleSeekEnd = () => setDragging(false);

  const formatTime = (time) => {
    if (!time) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="relative w-full h-full flex justify-center items-center bg-black overflow-hidden">
      {/* Video */}
      <AnimatePresence mode="wait">
        <motion.video
          key={clip.id}
          ref={videoRef}
          src={clip.video_url}
          className="w-full h-full object-cover rounded-2xl max-w-full"
          loop
          playsInline
          onClick={togglePlayPause}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 0.95 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      </AnimatePresence>

      {/* Play Button */}
      {paused && (
        <motion.button
          onClick={togglePlayPause}
          className="absolute inset-0 m-auto w-12 h-12 sm:w-16 sm:h-16 flex justify-center items-center text-white bg-black/60 rounded-full text-2xl sm:text-3xl z-20"
        >
          <FaPlay />
        </motion.button>
      )}

      {/* Right Buttons */}
      <div className="absolute bottom-[15%] right-3 sm:right-4 flex flex-col items-center gap-4 sm:gap-6 z-20">
        <button onClick={toggleLike} className="flex flex-col items-center">
          <FaHeart className={`text-2xl sm:text-3xl ${likedByMe ? "text-red-500" : "text-white"}`} />
          <span className="text-xs sm:text-sm text-white">{likes}</span>
        </button>

        <button onClick={handleCommentClick} className="flex flex-col items-center text-white">
          <FaComment className="text-2xl sm:text-3xl" />
          <span className="text-xs sm:text-sm">{commentsCount}</span>
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-20 left-3 sm:left-4 text-white z-20 flex flex-col gap-1 max-w-[90vw] sm:max-w-[95vw]">
        <p className="text-xs sm:text-sm font-bold truncate">{clip.title}</p>
        <div
          className="flex items-center gap-1 sm:gap-2 cursor-pointer"
          onClick={() => navigate(`/profile/${clip.author_id}`)}
        >
          <img
            src={clip.avatar_url || "/default-avatar.png"}
            alt={clip.author}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
          />
          <span className="font-semibold text-xs sm:text-sm truncate max-w-[50vw] sm:max-w-[60vw]">{clip.author}</span>
        </div>
      </div>

      {/* Seek Bar */}
      <div
        className="absolute bottom-12 left-3 right-3 sm:left-4 sm:right-4 flex items-center gap-1 sm:gap-2 text-white text-xs sm:text-xs z-20"
        onMouseDown={handleSeekStart}
        onMouseMove={handleSeekMove}
        onMouseUp={handleSeekEnd}
        onMouseLeave={handleSeekEnd}
        onTouchStart={handleSeekStart}
        onTouchMove={handleSeekMove}
        onTouchEnd={handleSeekEnd}
      >
        <span>{formatTime(currentTime)}</span>
        <div className="flex-1 h-1 bg-gray-700 rounded relative cursor-pointer">
          <div
            className="h-full bg-blue-500 rounded"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
