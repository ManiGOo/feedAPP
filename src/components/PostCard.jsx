import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Repeat2,
  MoreVertical,
  User,
  Bookmark,
  CheckCircle,
  Edit3,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function PostCard({
  id,
  author,
  author_id,
  author_avatar,
  content,
  created_at,
  image,
  video,
  repost_from_user,
  repost_from_id,
  repost_at,
  quote_from_id,
  quote_from_user,
  quote_content,
  quote_image,
  quote_video,
  is_verified = false,
  showDelete = false,
  onDelete,
  hideEdit = false,
  // Stats
  like_count = 0,
  liked_by_me = false,
  repost_count = 0,
  reposted_by_me = false,
  comments_count = 0,
  bookmark_count = 0,
  bookmarked_by_me = false,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* ---------- STATE ---------- */
  const [stats, setStats] = useState({
    likes: like_count,
    liked: liked_by_me,
    reposts: repost_count,
    reposted: reposted_by_me,
    comments: comments_count,
    bookmarks: bookmark_count,
    bookmarked: bookmarked_by_me,
  });
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const menuRef = useRef(null);
  const moreBtnRef = useRef(null);
  const cardRef = useRef(null);

  /* ---------- OPTIMISTIC UI ---------- */
  const handleLike = async () => {
    if (!user || loading) return;
    const wasLiked = stats.liked;
    setStats((prev) => ({
      ...prev,
      liked: !wasLiked,
      likes: wasLiked ? prev.likes - 1 : prev.likes + 1,
    }));
    setHeartAnim(true);
    try {
      const { liked, like_count } = await api.toggleLike(id);
      setStats((prev) => ({ ...prev, liked, likes: like_count }));
    } catch {
      setStats((prev) => ({
        ...prev,
        liked: wasLiked,
        likes: wasLiked ? prev.likes - 1 : prev.likes + 1,
      }));
    } finally {
      setTimeout(() => setHeartAnim(false), 300);
    }
  };

  const handleRepost = async () => {
    if (!user || stats.reposted || loading) return;
    setStats((prev) => ({ ...prev, reposted: true, reposts: prev.reposts + 1 }));
    try {
      await api.repost(id);
    } catch {
      setStats((prev) => ({ ...prev, reposted: false, reposts: prev.reposts - 1 }));
    }
  };

  const handleUndoRepost = async () => {
    if (!user || !stats.reposted || loading) return;
    setStats((prev) => ({ ...prev, reposted: false, reposts: prev.reposts - 1 }));
    try {
      await api.undoRepost(id);
    } catch {
      setStats((prev) => ({ ...prev, reposted: true, reposts: prev.reposts + 1 }));
    }
  };

  const handleBookmark = async () => {
    if (!user || loading) return;
    const was = stats.bookmarked;
    setStats((prev) => ({
      ...prev,
      bookmarked: !was,
      bookmarks: was ? prev.bookmarks - 1 : prev.bookmarks + 1,
    }));
    try {
      await (was ? api.unbookmark(id) : api.bookmark(id));
    } catch {
      setStats((prev) => ({
        ...prev,
        bookmarked: was,
        bookmarks: was ? prev.bookmarks - 1 : prev.bookmarks + 1,
      }));
    }
  };

  /* ---------- HELPERS ---------- */
  const formatNumber = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n);
  const formatDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    if (h < 24) return `${h}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const isRepost = !!repost_from_user;
  const isQuote = !!quote_from_id;

  /* ---------- MENU & EDIT ---------- */
  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  // Double-click to exit edit mode
  useEffect(() => {
    let clickCount = 0;
    const handleDoubleClick = () => {
      clickCount++;
      if (clickCount === 2) {
        setEditMode(false);
        clickCount = 0;
      } else {
        setTimeout(() => (clickCount = 0), 300);
      }
    };
    if (editMode && cardRef.current) {
      cardRef.current.addEventListener("click", handleDoubleClick);
    }
    return () => {
      if (cardRef.current) {
        cardRef.current.removeEventListener("click", handleDoubleClick);
      }
    };
  }, [editMode]);

  // Close menu on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        moreBtnRef.current &&
        !moreBtnRef.current.contains(e.target)
      ) {
        closeMenu();
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  return (
    <div
      ref={cardRef}
      className="relative border-b border-gray-200 dark:border-gray-800 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-950/50 transition-colors cursor-pointer"
      onClick={(e) => {
        if (!editMode) navigate(`/post/${id}`);
      }}
    >
      {/* EDIT OVERLAY */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-4 max-w-sm w-full mx-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Edit Post</h3>
                <button
                  onClick={() => setEditMode(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={20} />
                </button>
              </div>
              <button
                onClick={() => {
                  navigate(`/post/edit/${id}`);
                  setEditMode(false);
                }}
                className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition flex items-center justify-center gap-2"
              >
                <Edit3 size={18} />
                Open Editor
              </button>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Double-tap anywhere to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REPOST BANNER */}
      {isRepost && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <Repeat2 size={14} />
          <span
            className="hover:underline font-medium"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${repost_from_id}`);
            }}
          >
            {repost_from_user}
          </span>
          <span>reposted</span>
          {repost_at && <span>· {formatDate(repost_at)}</span>}
        </div>
      )}

      <div className="flex gap-3">
        {/* AVATAR */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {author_avatar ? (
              <img src={author_avatar} alt={author} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={20} className="text-gray-500" />
              </div>
            )}
          </div>
        </div>

        {/* CONTENT + ACTIONS */}
        <div className="flex-1 min-w-0">
          {/* HEADER */}
          <div className="flex items-center gap-1 text-sm">
            <span
              className="font-bold hover:underline text-base"
              onClick={(e) => {
                e.stopPropagation();
                navigate(author_id === user?.id ? "/profile/me" : `/profile/${author_id}`);
              }}
            >
              {author}
            </span>
            {is_verified && <CheckCircle size={18} className="text-blue-500 fill-blue-500" />}
            <span className="text-gray-500">· {formatDate(created_at)}</span>

            {/* MORE MENU (owner only) */}
            {showDelete && (
              <button
                ref={moreBtnRef}
                onClick={(e) => {
                  e.stopPropagation();
                  openMenu();
                }}
                className="ml-auto p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <MoreVertical size={16} />
              </button>
            )}
          </div>

          {/* TEXT */}
          <p className="text-[15px] text-gray-900 dark:text-gray-100 mt-0.5 break-words whitespace-pre-wrap">
            {content}
          </p>

          {/* QUOTE POST */}
          {isQuote && (
            <div
              className="mt-3 p-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/post/${quote_from_id}`);
              }}
            >
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <span className="font-medium">{quote_from_user}</span>
                <span>· Quoted</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200">{quote_content}</p>
              {quote_image && (
                <img src={quote_image} alt="" className="mt-2 rounded-lg max-h-48 w-full object-cover" />
              )}
              {quote_video && (
                <video src={quote_video} controls className="mt-2 rounded-lg max-h-48 w-full" />
              )}
            </div>
          )}

          {/* MEDIA */}
          {image && !isQuote && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-300 dark:border-gray-700">
              <img src={image} alt="" className="w-full" loading="lazy" />
            </div>
          )}
          {video && !isQuote && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-300 dark:border-gray-700">
              <video src={video} controls className="w-full" preload="metadata" />
            </div>
          )}

          {/* ACTION BAR */}
          <div className="flex items-center justify-between mt-3 text-gray-500 text-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/post/${id}`);
              }}
              className="flex items-center gap-1.5 hover:text-blue-500 transition"
            >
              <MessageCircle size={18} />
              <span className="text-[13px]">{loading ? "—" : formatNumber(stats.comments)}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                stats.reposted ? handleUndoRepost() : handleRepost();
              }}
              disabled={!user || loading}
              className={`flex items-center gap-1.5 transition ${
                stats.reposted ? "text-green-500" : "hover:text-green-500"
              } ${!user && "opacity-50"}`}
            >
              <Repeat2 size={18} />
              <span className="text-[13px]">{loading ? "—" : formatNumber(stats.reposts)}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              disabled={!user || loading}
              className={`flex items-center gap-1.5 transition ${
                stats.liked ? "text-red-500" : "hover:text-red-500"
              } ${!user && "opacity-50"}`}
            >
              <motion.div
                animate={heartAnim ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart size={18} fill={stats.liked ? "currentColor" : "none"} />
              </motion.div>
              <span className="text-[13px]">{loading ? "—" : formatNumber(stats.likes)}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark();
              }}
              disabled={!user || loading}
              className={`flex items-center gap-1.5 transition ${
                stats.bookmarked ? "text-blue-500" : "hover:text-blue-500"
              } ${!user && "opacity-50"}`}
            >
              <Bookmark size={18} fill={stats.bookmarked ? "currentColor" : "none"} />
              <span className="text-[13px]">{loading ? "—" : formatNumber(stats.bookmarks)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MORE MENU */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-4 top-12 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setConfirmDelete(true);
                setMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete post
            </button>
            {!hideEdit && (
              <button
                onClick={() => {
                  setEditMode(true);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
              >
                <Edit3 size={16} />
                Edit post
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM MODAL */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-5 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg mb-2">Delete post?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This can’t be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(id);
                    setConfirmDelete(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium"
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