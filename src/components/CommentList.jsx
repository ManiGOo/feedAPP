import React, { useState } from "react";
import { X, Edit3 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function CommentList({ commentsData, onDeleteComment, onUpdateComment, showPostContent, showDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const handleEditClick = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdate = async (commentId) => {
    try {
      const res = await api.put(`/comments/${commentId}`, { content: editContent });
      onUpdateComment(commentId, res.data.content);
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      console.error("Failed to update comment:", err);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      onDeleteComment(commentId);
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  const goToPost = (postId) => {
    navigate(`/post/${postId}`);
  };

  return (
    <div className="space-y-4 mt-3">
      {commentsData.length === 0 && (
        <p className="text-gray-500 text-sm">No comments yet.</p>
      )}

      {commentsData.map((c) => (
        <div
          key={c.id}
          className="relative group p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex flex-col gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer"
          onClick={() => goToPost(c.post_id)}
        >
          {/* Post preview */}
          {showPostContent && c.post_content && (
            <div
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md mb-2 transition-all cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                {c.post_content.length > 100
                  ? c.post_content.slice(0, 100) + "..."
                  : c.post_content}
              </p>
            </div>
          )}

          {/* Comment */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-semibold">{c.username}</p>
              {editingId === c.id ? (
                <div className="flex flex-col gap-2 mt-1">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
                    onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking textarea
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent navigation
                        handleUpdate(c.id);
                      }}
                      className="px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent navigation
                        setEditingId(null);
                      }}
                      className="px-3 py-1 rounded-lg bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{c.content}</p>
              )}
            </div>

            {/* Edit/Delete buttons */}
            {showDelete && user?.id === c.user_id && editingId !== c.id && (
              <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigation
                    handleEditClick(c);
                  }}
                  className="hover:text-blue-500"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigation
                    handleDelete(c.id);
                  }}
                  className="hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}