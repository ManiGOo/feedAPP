// src/components/PostForm.jsx
import { useState, useRef, useEffect } from "react";
import api from "../utils/api";

function PostForm({ onPostCreated }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null); // file state
  const maxChars = 280;
  const inputRef = useRef(null);

  const handlePost = async () => {
    if (!text.trim() && !file) return; // require text or file
    try {
      const token = localStorage.getItem("accessToken");

      const formData = new FormData();
      formData.append("content", text);
      if (file) formData.append(file.type.startsWith("video/") ? "video" : "image", file);

      const res = await api.post("/posts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setText("");
      setFile(null);
      if (onPostCreated) onPostCreated(res.data);
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  // Auto-resize input height
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = inputRef.current.scrollHeight + "px";
    }
  }, [text]);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl p-4 mb-6">
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="w-10 h-10 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center font-semibold text-white">
          U
        </div>

        <div className="flex-1">
          {/* Expanding text input */}
          <input
            ref={inputRef}
            type="text"
            placeholder="What's happening?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={maxChars}
            className="w-full border-none bg-transparent resize-none overflow-hidden focus:ring-0 dark:text-gray-200 text-base placeholder-gray-400 leading-snug"
            style={{ minHeight: "3rem" }}
          />

          {/* File Upload */}
          <div className="mt-3">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Add Image or Video
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 cursor-pointer"
            />
            {file && (
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Selected: {file.name}
              </p>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex justify-between items-center mt-3">
            <span className={`text-sm ${text.length > maxChars - 20 ? "text-red-500" : "text-gray-500"}`}>
              {text.length}/{maxChars}
            </span>
            <button
              onClick={handlePost}
              disabled={!text.trim() && !file}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
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
