// src/components/PostForm.jsx
import { useState } from "react";
import api from "../utils/api";

function PostForm({ onPostCreated }) {
  const [text, setText] = useState("");
  const maxChars = 280;

  const handlePost = async () => {
    if (!text.trim()) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await api.post(
        "/posts",
        { content: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setText("");
      if (onPostCreated) onPostCreated(res.data);
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl p-4 mb-6">
      <div className="flex space-x-3">
        <div className="w-10 h-10 bg-gray-400 rounded-full"></div>
        <div className="flex-1">
          <textarea
            placeholder="What's happening?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={maxChars}
            className="w-full border-none bg-transparent resize-none focus:ring-0 dark:text-gray-200 text-sm placeholder-gray-400"
            rows={3}
          />
          <div className="flex justify-between items-center mt-2">
            <span
              className={`text-sm ${
                text.length > maxChars - 20 ? "text-red-500" : "text-gray-500"
              }`}
            >
              {text.length}/{maxChars}
            </span>
            <button
              onClick={handlePost}
              disabled={!text.trim()}
              className="px-4 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostForm;
