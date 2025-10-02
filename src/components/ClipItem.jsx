import React, { useRef, useEffect, useState } from "react";
import { FaHeart, FaComment, FaVolumeMute, FaVolumeUp, FaPlay } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function ClipItem({ clip, onCommentClick, updateClipCounts }) {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const [liked, setLiked] = useState(clip.liked_by_me);
  const [likeCount, setLikeCount] = useState(clip.like_count);
  const [commentsCount, setCommentsCount] = useState(clip.comments_count || 0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState(clip.title);
  const [avatarUrl, setAvatarUrl] = useState(clip.avatar_url);
  const [author, setAuthor] = useState(clip.author);
  const [videoKey, setVideoKey] = useState(clip.id);
  const [loaded, setLoaded] = useState(false);

  // Update states when clip changes
  useEffect(() => {
    setLiked(clip.liked_by_me);
    setLikeCount(clip.like_count);
    setCommentsCount(clip.comments_count || 0);
    setTitle(clip.title);
    setAvatarUrl(clip.avatar_url);
    setAuthor(clip.author);
    setVideoKey(clip.id);
    setLoaded(false);
  }, [clip]);

  // Auto-play/pause based on visibility
  useEffect(() => {
    if (!videoRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !paused) videoRef.current.play().catch(() => {});
          else videoRef.current.pause();
        });
      },
      { threshold: 0.75 }
    );
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [paused]);

  // Volume/mute sync
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = volume;
    videoRef.current.muted = muted;
  }, [volume, muted]);

  // Track currentTime and duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const timeUpdate = () => !dragging && setCurrentTime(video.currentTime);
    const loadedMetadata = () => {
      setDuration(video.duration);
      setLoaded(true);
    };

    video.addEventListener("timeupdate", timeUpdate);
    video.addEventListener("loadedmetadata", loadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", timeUpdate);
      video.removeEventListener("loadedmetadata", loadedMetadata);
    };
  }, [dragging, videoKey]);

  const toggleLike = async () => {
    try {
      const data = await api.toggleLikeClip(clip.id);
      setLiked(data.liked);
      setLikeCount(data.like_count);
      if (updateClipCounts) updateClipCounts(clip.id, data.like_count, commentsCount);
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const toggleMute = () => {
    if (muted) {
      setMuted(false);
      if (volume === 0) setVolume(0.5);
    } else setMuted(true);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPaused(false);
    } else {
      videoRef.current.pause();
      setPaused(true);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMuted(val === 0);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const handleSeekStart = () => setDragging(true);
  const handleSeekMove = (e) => {
    if (!dragging || !videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const pos = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    setCurrentTime((pos / rect.width) * duration);
  };
  const handleSeekEnd = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = currentTime;
    setDragging(false);
  };

  return (
    <div className="relative w-full h-full flex justify-center items-center bg-black">
      <AnimatePresence mode="wait">
        <motion.video
          key={videoKey}
          ref={videoRef}
          src={clip.video_url}
          className="w-auto max-w-full max-h-full object-contain"
          loop
          muted={muted}
          playsInline
          onClick={togglePlayPause}
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>

      {/* Pause overlay */}
      {paused && (
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 m-auto w-16 h-16 flex justify-center items-center text-white bg-black/40 rounded-full text-3xl z-20"
        >
          <FaPlay />
        </button>
      )}

      {/* Volume control */}
      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full z-20"
          >
            <button onClick={toggleMute} className="text-white text-lg">
              {muted ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-32 h-1 accent-blue-500 rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right-side buttons */}
      <div className="absolute bottom-32 right-4 flex flex-col items-center gap-6 z-20">
        <motion.button
          whileTap={{ scale: 1.2 }}
          className="flex flex-col items-center text-white"
          onClick={toggleLike}
        >
          <motion.span
            animate={{ color: liked ? "#ef4444" : "#ffffff" }}
            transition={{ duration: 0.2 }}
          >
            <FaHeart className="text-3xl" />
          </motion.span>
          <motion.span
            animate={{ scale: [0.8, 1], opacity: [0, 1] }}
            transition={{ duration: 0.3 }}
            className="text-sm"
          >
            {likeCount}
          </motion.span>
        </motion.button>

        <button className="flex flex-col items-center text-white" onClick={onCommentClick}>
          <FaComment className="text-3xl" />
          <motion.span
            animate={{ scale: [0.8, 1], opacity: [0, 1] }}
            transition={{ duration: 0.3 }}
            className="text-sm"
          >
            {commentsCount}
          </motion.span>
        </button>
      </div>

      {/* Clip title */}
      {title && (
        <div className="absolute bottom-24 left-4 text-white z-20 mb-5">
          <p className="text-sm font-bold">{title}</p>
        </div>
      )}

      {/* Avatar */}
      <div
        className="absolute bottom-16 left-4 flex items-center gap-3 z-20 cursor-pointer"
        onClick={() => navigate(`/profile/${clip.author_id}`)}
      >
        <img
          src={avatarUrl || "/default-avatar.png"}
          alt={author || "Unknown"}
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="font-semibold text-white">{author || "Unknown"}</span>
      </div>

      {/* Bottom draggable progress bar */}
      <div className="absolute bottom-2 left-4 right-4 flex items-center gap-2 text-white text-xs z-20">
        <span>{formatTime(currentTime)}</span>
        <div
          className="flex-1 h-1 bg-gray-700 rounded relative cursor-pointer"
          onMouseDown={handleSeekStart}
          onMouseMove={handleSeekMove}
          onMouseUp={handleSeekEnd}
          onMouseLeave={handleSeekEnd}
          onTouchStart={handleSeekStart}
          onTouchMove={handleSeekMove}
          onTouchEnd={handleSeekEnd}
        >
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
