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
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef(null);

  // Preview URL when file changes
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setLoaded(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Sync volume/mute
  useEffect(() => {
    if (videoRef.current && loaded) {
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
    }
  }, [volume, muted, loaded]);

  const toggleMute = () => {
    setMuted((prev) => !prev);
    if (!muted && volume === 0) setVolume(0.5);
  };

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

      const uploadedClip = await api.uploadClip(title.trim(), file);

      // Construct updated clip object to send back
      const updatedClip = {
        ...uploadedClip,
        author: currentUser.username,
        avatar_url: currentUser.avatar_url,
        like_count: 0,
        comments_count: 0,
        liked_by_me: false,
      };

      onUploaded(updatedClip); // update parent / ClipItem dynamically

      // Reset overlay state
      setFile(null);
      setTitle("");
      setProgress(0);
      setPreview(null);
      setLoaded(false);
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
        >
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 w-full max-w-md rounded-2xl flex flex-col p-4 relative"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white text-xl z-20"
            >
              <FaTimes />
            </button>

            <h2 className="text-white text-lg font-semibold mb-4">Post a Video</h2>

            <input
              type="text"
              placeholder="Video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              className="w-full mb-4 px-3 py-2 rounded bg-gray-800 text-white"
            />

            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files[0])}
              disabled={uploading}
              className="mb-4 text-white"
            />

            {preview && (
              <div className="relative w-full mb-4 rounded overflow-hidden">
                <motion.video
                  key={preview}
                  ref={videoRef}
                  src={preview}
                  className="w-auto max-w-full max-h-64 rounded object-contain"
                  loop
                  playsInline
                  autoPlay
                  onLoadedData={() => {
                    setLoaded(true);
                    videoRef.current.play().catch(() => {});
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: loaded ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                  onClick={() => {
                    if (!loaded) return;
                    if (videoRef.current.paused) videoRef.current.play();
                    else videoRef.current.pause();
                  }}
                />

                {/* Volume slider */}
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
                    className="w-32 h-1 accent-blue-500 rounded-lg"
                  />
                </div>

                {/* Upload progress bar */}
                {uploading && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-600">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading || !file || !title.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {uploading ? `Uploading... ${progress}%` : "Upload"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
