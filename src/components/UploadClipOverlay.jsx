import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaVolumeMute, FaVolumeUp, FaPlay, FaPause } from "react-icons/fa";
import api from "../utils/api";

export default function UploadClipOverlay({ show, onClose, onUploaded, currentUser }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef(null);
  const isMobile = window.innerWidth < 768;
  const [bottomOffset, setBottomOffset] = useState(isMobile ? 34 : 16);

  // Create preview URL
  useEffect(() => {
    if (!file) {
      setPreview(null);
      setVideoDimensions({ width: 0, height: 0 });
      setVideoLoaded(false);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setVideoLoaded(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Sync volume/mute and play state
  useEffect(() => {
    if (videoRef.current && videoLoaded) {
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [volume, muted, videoLoaded, isPlaying]);

  // Handle video metadata for sizing
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const { videoWidth, videoHeight } = videoRef.current;
    if (!videoWidth || !videoHeight) return;

    const maxWidth = 400; // Match CommentsPanel
    const maxHeight = window.innerHeight * 0.8 - 140; // Space for title, button, safe area
    let width = videoWidth;
    let height = videoHeight;
    const aspectRatio = width / height;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    setVideoDimensions({ width, height });
    setVideoLoaded(true);
  };

  const toggleMute = () => setMuted((prev) => !prev);
  const togglePlay = () => setIsPlaying((prev) => !prev);

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMuted(val === 0);
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("title", title.trim());

      const res = await api.uploadClip(formData, (event) => {
        setProgress(Math.round((event.loaded * 100) / event.total));
      });

      const enrichedClip = {
        ...res,
        author: currentUser?.username || "Unknown",
        avatar_url: currentUser?.avatar_url || "/default-avatar.png",
        like_count: 0,
        comments_count: 0,
        liked_by_me: false,
        is_followed_author: false,
      };

      onUploaded?.(enrichedClip);

      setFile(null);
      setTitle("");
      setPreview(null);
      setVideoLoaded(false);
      setProgress(0);
      setVideoDimensions({ width: 0, height: 0 });
      onClose();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-center items-end md:items-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            drag="y"
            dragConstraints={{ top: -50, bottom: 50 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => info.offset.y > 100 && onClose()}
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.3 }}
            className="bg-black/80 w-full md:w-[400px] max-h-[80%] rounded-t-2xl md:rounded-2xl flex flex-col p-4 overflow-hidden relative shadow-lg"
            style={{
              paddingBottom: bottomOffset,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <motion.button
              onClick={onClose}
              className="absolute top-3 right-3 text-white text-2xl p-2 hover:bg-gray-700 rounded-full z-20"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaTimes />
            </motion.button>

            {/* Title */}
            <h2 className="text-white text-lg font-semibold mb-4 text-center">
              Post a Video
            </h2>

            {/* Title Input */}
            <input
              type="text"
              placeholder="Video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              className="w-full mb-4 px-4 py-2 rounded-full bg-white/10 text-white placeholder-gray-400 focus:outline-none"
            />

            {/* File Input */}
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files[0])}
              disabled={uploading}
              className="mb-4 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-white/10 file:text-white file:border-0 file:hover:bg-white/20"
            />

            {/* Video Preview */}
            {preview && (
              <div
                className="relative w-full mb-4 rounded-2xl overflow-hidden"
                style={{
                  width: videoDimensions.width || "100%",
                  height: videoDimensions.height || "auto",
                }}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                <video
                  ref={videoRef}
                  src={preview}
                  className="w-full h-full object-cover rounded-2xl"
                  loop
                  playsInline
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={togglePlay}
                />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl"
                  animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    onClick={togglePlay}
                    className="text-white text-4xl"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isPlaying ? <FaPause /> : <FaPlay />}
                  </motion.button>
                </motion.div>
                <motion.div
                  className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full"
                  animate={{ opacity: showControls ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    onClick={toggleMute}
                    className="text-white text-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {muted ? <FaVolumeMute /> : <FaVolumeUp />}
                  </motion.button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 accent-blue-500 rounded-lg"
                  />
                </motion.div>
                {uploading && (
                  <motion.div
                    className="absolute bottom-0 left-0 w-full h-1 bg-gray-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="h-full bg-blue-500" />
                  </motion.div>
                )}
              </div>
            )}

            {/* Upload Button */}
            <motion.button
              onClick={handleUpload}
              disabled={uploading || !file || !title.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded-full w-full mt-auto disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {uploading ? `Uploading... ${progress}%` : "Upload"}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}