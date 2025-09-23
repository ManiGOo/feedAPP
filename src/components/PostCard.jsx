// src/components/PostCard.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Repeat2, MoreVertical, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function PostCard({
  id,
  author,
  author_id,
  avatar_url,
  content,
  like_count = 0,
  liked_by_me = false,
  image,
  video,
  commentsNumber = 0,
  showDelete = false,
  onDelete,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [likes, setLikes] = useState(like_count);
  const [liked, setLiked] = useState(liked_by_me);
  const [heartAnim, setHeartAnim] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    setLikes(like_count);
    setLiked(liked_by_me);
  }, [like_count, liked_by_me]);

  const handleLike = async () => {
    if (!user) return;
    try {
      setLiked((prev) => !prev);
      setLikes((prev) => (liked ? prev - 1 : prev + 1));
      setHeartAnim(true);

      const res = await api.post(`/posts/${id}/like`);
      setLiked(res.data.liked);
      setLikes(res.data.like_count);
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setLiked((prev) => !prev);
      setLikes((prev) => (liked ? prev - 1 : prev + 1));
    } finally {
      setTimeout(() => setHeartAnim(false), 300);
    }
  };

  const handleCommentClick = () => navigate(`/post/${id}`);
  const handleDeleteConfirm = () => {
    if (onDelete) onDelete(id);
    setShowConfirm(false);
    setShowMenu(false);
  };

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-4 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() =>
            author_id === user?.id
              ? navigate("/profile/me")
              : navigate(`/profile/${author_id}`)
          }
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-white">
            {avatar_url ? (
              <img
                src={avatar_url}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {author || "Unknown"}
          </p>
        </div>

        {showDelete && onDelete && (
          <div className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <MoreVertical size={18} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  className="absolute right-0 mt-2 w-28 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <button
                    onClick={() => {
                      setShowConfirm(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 rounded-t-xl"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-xl"
                  >
                    Edit
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Content */}
      <p className="mt-3 text-gray-800 dark:text-gray-300 text-[15px] leading-relaxed">
        {content}
      </p>

      {/* Media */}
      {image && !imageError ? (
        <img
          src={image}
          alt="post"
          className="mt-3 w-full rounded-xl max-h-[500px] object-cover border border-gray-200 dark:border-gray-800"
          onError={() => setImageError(true)}
        />
      ) : imageError ? (
        <div className="mt-3 w-full h-[300px] bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded-xl">
          <p className="text-gray-500">Image unavailable</p>
        </div>
      ) : null}

      {video && !videoError ? (
        <video
          src={video}
          controls
          className="mt-3 w-full rounded-xl max-h-[500px] object-cover border border-gray-200 dark:border-gray-800"
          onError={() => setVideoError(true)}
        />
      ) : videoError ? (
        <div className="mt-3 w-full h-[300px] bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded-xl">
          <p className="text-gray-500">Video unavailable</p>
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-3 flex justify-between max-w-[300px]">
        <button
          onClick={handleLike}
          disabled={!user}
          className={`flex items-center gap-1 text-sm transition ${
            liked ? "text-red-500" : "text-gray-500 dark:text-gray-400"
          } ${!user ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
        >
          <motion.div
            animate={heartAnim ? { scale: [1, 1.6, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Heart size={18} />
          </motion.div>
          <span className="ml-1">{likes}</span>
        </button>

        <button
          onClick={() => navigate(`/post/${id}`)}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:opacity-80"
        >
          <MessageCircle size={18} />
          <span>{commentsNumber}</span>
        </button>

        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 opacity-70">
          <Repeat2 size={18} />
          <span>Repost</span>
        </div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <p className="text-gray-800 dark:text-gray-200 mb-4">
                Are you sure you want to delete this post?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1 rounded-lg bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
