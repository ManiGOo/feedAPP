import { useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext.jsx";

export default function CreatePost({ onNewPost }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth(); // get current user

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !user) return; // safety: user must exist

    try {
      setSubmitting(true);
      const res = await api.post(
        "/posts",
        { content },
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      onNewPost?.(res.data); // prepend new post to feed
      setContent(""); // clear textarea
    } catch (err) {
      console.error("Failed to create post", err.response?.data || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-6 transition-colors mb-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={submitting || !user}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
}
