// src/pages/PostDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";

function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/posts/${id}`);
        setPost(res.data.post);
        setComments(res.data.comments || []);
      } catch (err) {
        console.error("Failed to fetch post:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${id}/comments`, { content: newComment });
      setComments((prev) => [...prev, res.data]); // append new comment
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err.response?.data || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <p className="text-center text-gray-700 dark:text-gray-300 mt-10">
        Loading post...
      </p>
    );
  }

  if (!post) {
    return (
      <p className="text-center text-red-500 mt-10">
        Failed to load post.
      </p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Post */}
      <div className="border rounded-2xl shadow p-4 mb-6 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={post.avatar_url}
            alt={post.author}
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="font-semibold">{post.author}</span>
        </div>
        <p className="mb-3">{post.content}</p>
        {post.media_url && (
          post.media_type === "video" ? (
            <video src={post.media_url} controls className="w-full rounded-xl" />
          ) : (
            <img src={post.media_url} alt="Post media" className="w-full rounded-xl" />
          )
        )}
      </div>

      {/* Comments */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Comments</h3>
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="border-b pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <img
                    src={c.avatar_url}
                    alt={c.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-semibold">{c.username}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{c.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Comment */}
      <form onSubmit={handleAddComment} className="flex gap-2">
        <input
          type="text"
          placeholder="Write a comment..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting}
          className={`px-4 py-2 rounded-lg text-white ${
            submitting ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {submitting ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default PostDetail;
