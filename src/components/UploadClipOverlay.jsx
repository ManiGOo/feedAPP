import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
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
  const videoRef = useRef(null);

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

  // Sync volume/mute
  useEffect(() => {
    if (videoRef.current && videoLoaded) {
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
    }
  }, [volume, muted, videoLoaded]);

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const { videoWidth, videoHeight } = videoRef.current;
    if (!videoWidth || !videoHeight) return;

    const maxWidth = 448;
    const maxHeight = window.innerHeight - 180; // added extra space for title & button
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
    videoRef.current.play().catch(() => {});
  };

  const toggleMute = () => setMuted(prev => !prev);
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
      formData.append("video", file); // must match backend field
      formData.append("title", title.trim());

      const res = await api.uploadClip(formData, event => {
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
          className="fixed inset-0 z-50 flex justify-center items-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            drag="y"
            dragConstraints={{ top: -50, bottom: 50 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => info.offset.y > 100 && onClose()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 w-full md:w-auto rounded-2xl flex flex-col p-4 relative overflow-hidden max-h-[90vh]"
            style={{
              maxWidth: videoDimensions.width || 448,
              height: videoDimensions.height ? videoDimensions.height + 140 : "auto",
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white text-2xl p-2 hover:bg-gray-700 rounded-full z-20"
            >
              <FaTimes />
            </button>

            <h2 className="text-white text-lg font-semibold mb-4 text-center">Post a Video</h2>

            <input
              type="text"
              placeholder="Video title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={uploading}
              className="w-full mb-4 px-3 py-2 rounded bg-gray-800 text-white"
            />

            <input
              type="file"
              accept="video/*"
              onChange={e => setFile(e.target.files[0])}
              disabled={uploading}
              className="mb-4 text-white"
            />

            {preview && (
              <div
                className="relative w-full mb-4 rounded overflow-hidden"
                style={{
                  width: videoDimensions.width || "100%",
                  height: videoDimensions.height || "auto",
                }}
              >
                <video
                  ref={videoRef}
                  src={preview}
                  className="w-full h-full object-cover rounded"
                  loop
                  playsInline
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current.pause()}
                />

                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full">
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
                    className="w-24 h-1 accent-blue-500 rounded-lg"
                  />
                </div>

                {uploading && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-600">
                    <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading || !file || !title.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded w-full mt-auto"
            >
              {uploading ? `Uploading... ${progress}%` : "Upload"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
