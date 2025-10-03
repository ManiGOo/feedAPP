// src/components/CommentsPanel.jsx
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api, { socket, onNewClipComment } from "../utils/api";

export default function CommentsPanel({ show, clip, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const scrollRef = useRef(null);

  // -------------------- FETCH COMMENTS --------------------
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

  // -------------------- SCROLL TO BOTTOM --------------------
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [comments]);

  // -------------------- SOCKET LISTENER --------------------
  useEffect(() => {
    const handleNewComment = (comment) => {
      if (comment.clip_id === clip.id) {
        setComments((prev) => [...prev, comment]);
        onCommentAdded?.();
      }
    };
    onNewClipComment(handleNewComment);

    return () => socket.off("newClipComment", handleNewComment);
  }, [clip.id, onCommentAdded]);

  // -------------------- ADD COMMENT --------------------
  const addComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await api.commentClip(clip.id, newComment.trim());
      setNewComment("");
      // The socket listener will add the comment to state
      onCommentAdded?.();
    } catch (err) {
      console.error("Failed to post comment:", err);
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

  // -------------------- JSX --------------------
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end md:justify-center items-end md:items-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => { if (info.offset.y > 100) onClose(); }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 w-full md:w-[400px] h-[70%] md:h-[80%] rounded-t-2xl md:rounded-2xl flex flex-col p-4 overflow-hidden relative"
          >
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
              className="flex-1 space-y-2 mt-8 md:mt-4 overflow-y-auto"
            >
              {comments.map((c) => (
                <div key={c.id} className="text-white p-2 border-b border-gray-700 rounded">
                  <p className="font-semibold">{c.username}</p>
                  <p className="text-gray-300">{c.content}</p>
                </div>
              ))}
            </div>

            {/* New Comment Input */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 rounded bg-gray-800 text-white"
                disabled={posting}
              />
              <button
                onClick={addComment}
                disabled={posting || !newComment.trim()}
                className="bg-blue-500 px-4 rounded text-white disabled:opacity-50"
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
