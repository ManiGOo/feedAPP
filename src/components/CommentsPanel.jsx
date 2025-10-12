import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api, { socket, onNewClipComment } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function CommentsPanel({ show, clip, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(0);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const isMobile = window.innerWidth < 768;

  // Fetch comments
  useEffect(() => {
    if (!clip) return;
    const fetchComments = async () => {
      try {
        const data = await api.getClipComments(clip.id);
        setComments(data);
      } catch (err) {
        console.error("Failed to fetch comments:", err);
      }
    };
    fetchComments();
  }, [clip]);

  // Socket listener
  useEffect(() => {
    if (!clip) return;
    const handleNewComment = (comment) => {
      if (comment.clip_id === clip.id) {
        setComments((prev) => [...prev, comment]);
        onCommentAdded?.();
      }
    };
    onNewClipComment(handleNewComment);
    return () => socket.off("newClipComment", handleNewComment);
  }, [clip.id, onCommentAdded]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [comments]);

  // Add comment
  const addComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;

    setPosting(true);
    try {
      const tempComment = {
        id: `temp-${Date.now()}`,
        content: trimmed,
        username: "You",
        clip_id: clip.id,
      };
      setComments((prev) => [...prev, tempComment]);
      setNewComment("");
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });

      const posted = await api.commentClip(clip.id, trimmed);
      setComments((prev) =>
        prev.map((c) => (c.id === tempComment.id ? posted : c))
      );

      onCommentAdded?.();
    } catch (err) {
      console.error("Failed to post comment:", err);
      setComments((prev) => prev.filter((c) => !c.id.startsWith("temp-")));
    } finally {
      setPosting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };

  // Bottom offset for safe areas (no dynamic keyboard adjustment needed in centered modal)
  useEffect(() => {
    setBottomOffset(isMobile ? 34 : 16); // Common safe-area-inset-bottom value for mobiles like iPhone
  }, [isMobile]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-black/80 w-full md:w-[400px] max-h-[80%] rounded-2xl flex flex-col p-4 overflow-hidden relative shadow-lg"
            style={{
              paddingBottom: bottomOffset,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Clip Author */}
            <div className="flex items-center mb-4 gap-3">
              <img
                src={clip.avatar_url || "/default-avatar.png"}
                alt={clip.author}
                className="w-10 h-10 rounded-full object-cover cursor-pointer border-2 border-white"
                onClick={() => navigate(`/profile/${clip.author_id}`)}
              />
              <p
                className="font-semibold text-white cursor-pointer hover:underline"
                onClick={() => navigate(`/profile/${clip.authorイド}`)}
              >
                {clip.author}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white text-2xl p-2 hover:bg-gray-700 rounded-full z-20"
              title="Close"
            >
              ✕
            </button>

            {/* Comments List */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-2 overflow-y-auto px-1"
            >
              {comments.map((c) => (
                <motion.div
                  key={c.id}
                  className="flex items-start gap-3 p-2 bg-white/10 rounded-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <img
                    src={c.avatar_url || "/default-avatar.png"}
                    alt={c.username}
                    className="w-10 h-10 rounded-full object-cover cursor-pointer flex-shrink-0 border border-white/30"
                    onClick={() => navigate(`/profile/${c.user_id}`)}
                  />
                  <div className="flex flex-col flex-1">
                    <p
                      className="font-semibold text-white cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile/${c.user_id}`)}
                    >
                      {c.username}
                    </p>
                    <p className="text-gray-300 break-words">{c.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* New Comment Input */}
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 rounded-full bg-white/10 text-white placeholder-gray-400 focus:outline-none"
                disabled={posting}
              />
              <button
                onClick={addComment}
                disabled={posting || !newComment.trim()}
                className="bg-blue-500 px-4 rounded-full text-white disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}