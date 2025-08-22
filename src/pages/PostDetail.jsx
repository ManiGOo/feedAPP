// src/pages/PostDetail.jsx
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../utils/api";

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/posts/${id}`);
        setPost(res.data.post);
        setComments(res.data.comments || []);
      } catch (err) {
        console.error("Failed to fetch post", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/posts/${id}/comments`, { content: newComment });
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment", err.response?.data || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center text-gray-700 dark:text-gray-300 mt-10">Loading post...</p>;
  if (!post) return <p className="text-center text-gray-700 dark:text-gray-300 mt-10">Post not found.</p>;

  return (
    <div className="ml-0 md:ml-64 pt-20 max-w-2xl mx-auto px-4 space-y-6">
      {/* Post Card */}
      <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-6 transition-colors">
        <p className="font-bold text-gray-900 dark:text-gray-100">{post.user}</p>
        <p className="text-gray-700 dark:text-gray-300 mt-2">{post.content}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{post.createdAt}</p>
      </div>

      {/* Comments Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Comments</h3>
        {comments.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 transition-colors">
              <p className="font-medium text-gray-900 dark:text-gray-100">{c.user}</p>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{c.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment */}
      <form onSubmit={handleCommentSubmit} className="mt-4 space-y-2">
        <textarea
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {submitting ? "Posting..." : "Comment"}
        </button>
      </form>
    </div>
  );
}
