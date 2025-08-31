import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Repeat2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function PostCard({
  id,
  author,
  author_id,
  avatar_url,
  content,
  like_count,
  liked_by_me,
  image,
  video,
  commentsNumber = 0,
  isFollowedAuthor = false,
  onFollowToggle,
  onDelete,
  showDelete = false, // Only show delete button if true
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likes, setLikes] = useState(like_count || 0);
  const [liked, setLiked] = useState(!!liked_by_me);
  const [heartAnim, setHeartAnim] = useState(false);
  const [following, setFollowing] = useState(isFollowedAuthor);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setLikes(like_count || 0);
    setLiked(!!liked_by_me);
    setFollowing(isFollowedAuthor);
  }, [like_count, liked_by_me, isFollowedAuthor]);

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await api.post(`/posts/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      setLiked(res.data.liked);
      setLikes(res.data.like_count);
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 300);
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleFollowClick = () => {
    if (!user || !onFollowToggle) return;
    setFollowing(prev => !prev);
    onFollowToggle(author_id);
  };

  const handleCommentClick = () => {
    navigate(`/post/${id}`);
  };

  const handleDeleteConfirm = () => {
    if (onDelete) onDelete(id);
    setShowConfirm(false);
  };

  const avatarLetter = author ? author[0].toUpperCase() : "U";

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-4 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold">
            {avatar_url ? <img src={avatar_url} alt="avatar" className="w-full h-full object-cover" /> : avatarLetter}
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{author || "Unknown"}</p>
        </div>

        <div className="flex gap-2 items-center">
          {user && user.id !== author_id && onFollowToggle && (
            <button
              onClick={handleFollowClick}
              className={`text-xs px-3 py-1 rounded-full font-medium transition ${following
                ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}

          {showDelete && onDelete && (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-red-500 hover:text-red-700 transition text-xs p-1 rounded-full"
              title="Delete post"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="mt-3 text-gray-800 dark:text-gray-300 text-[15px] leading-relaxed">{content}</p>

      {/* Media */}
      {image && <img src={image} alt="post" className="mt-3 w-full rounded-xl max-h-[500px] object-cover border border-gray-200 dark:border-gray-800" />}
      {video && <video src={video} controls className="mt-3 w-full rounded-xl max-h-[500px] object-cover border border-gray-200 dark:border-gray-800" />}

      {/* Actions */}
      <div className="mt-3 flex justify-between max-w-[300px]">
        <button onClick={handleLike} disabled={!user} className={`flex items-center gap-1 text-sm transition ${liked ? "text-red-500" : "text-gray-500 dark:text-gray-400"} ${!user ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}>
          <motion.div animate={heartAnim ? { scale: [1, 1.6, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}><Heart size={18} /></motion.div>
          <span className="ml-1">{likes}</span>
        </button>

        <button onClick={handleCommentClick} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:opacity-80">
          <MessageCircle size={18} />
          <span>{commentsNumber}</span>
        </button>

        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 opacity-70">
          <Repeat2 size={18} />
          <span>Repost</span>
        </div>
      </div>

      {/* Delete confirmation modal */}
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
              <p className="text-gray-800 dark:text-gray-200 mb-4">Are you sure you want to delete this post?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowConfirm(false)} className="px-3 py-1 rounded-lg bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600">Cancel</button>
                <button onClick={handleDeleteConfirm} className="px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
