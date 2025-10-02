import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";

export default function CommentsPanel({ show, clip, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!clip) return;
    const fetchComments = async () => {
      try {
        const res = await api.getClipComments(clip.id);
        setComments(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchComments();
  }, [clip]);

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await api.commentClip(clip.id, newComment);
      setComments((prev) => [res, ...prev]);
      setNewComment("");
      if (onCommentAdded) onCommentAdded(); // increment comment count on ClipItem
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end md:justify-center items-end md:items-center bg-black/40"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100) onClose(); // swipe down to close
            }}
            className="bg-gray-900 w-full md:w-[400px] h-[70%] md:h-[80%] rounded-t-2xl md:rounded-2xl flex flex-col p-4 overflow-y-auto relative"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white text-2xl p-1 md:p-2 hover:bg-gray-700 rounded-full z-20"
              title="Close"
            >
              ✕
            </button>

            <div className="flex-1 space-y-2 mt-8 md:mt-4">
              {comments.map((c) => (
                <div key={c.id} className="text-white p-2 border-b border-gray-700">
                  <p className="font-semibold">{c.username}</p>
                  <p>{c.content}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 rounded bg-gray-800 text-white"
              />
              <button
                onClick={addComment}
                className="bg-blue-500 px-4 rounded text-white"
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
